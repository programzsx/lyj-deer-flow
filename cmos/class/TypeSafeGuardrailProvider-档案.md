# TypeSafeGuardrailProvider-档案

## 一、这个类是干什么的

这个类是TypeSafe（Jev）门禁提供者。

这个类做工具调用执行前的风险门禁。

工作方式如下。

这个类发一个noul问题给TypeSafe服务。

问题是"这次工具调用是否可能造成不可逆或超出范围的影响"。

TypeSafe返回一个风险概率。

概率达到threshold就拒绝调用。

拒绝发生在执行之前。

代理能看到拒绝原因并换做法。

这个类位于backend/packages/harness/deerflow/guardrails/typesafe.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、类属性

- name的值是"typesafe"。
- policy_id的值是"deerflow.guardrails.typesafe"。
- policy_version的值是"1.1.0"。

### 2、构造方法

构造方法接受很多关键字参数。

连接类参数包括api_key、api_key_env、base_url、model、timeout、deadline_seconds、max_attempts、retry_backoff。

这些参数通过resolve_connection解析。

解析顺序是本provider的config，然后顶层typesafe块，然后内置默认值。

行为类参数包括threshold、instructions、criteria、tools、allowed_tools、max_state_chars、cache_size、cache_ttl_seconds。

- threshold默认0.5。概率达到阈值就拒绝。
- max_state_chars默认4000。这是状态文本的字符数上限。
- cache_size默认256。cache_ttl_seconds默认300秒。
- transport_factory是传输工厂。每个评估新建一个客户端。

所有参数都做急切验证。

坏配置在代理构建时失败。

坏配置不会等到第一次工具调用才失败。

### 3、evaluate和aevaluate方法

这两个方法做完整评估。

流程分三步。

第一步调用_prepare做本地预检。预检返回Probe或直接返回决定。

第二步查缓存。缓存命中就直接返回缓存决定。

第三步向TypeSafe发请求。拿到答案后做决定并写缓存。

### 4、_prepare方法（本地预检）

这个方法不发网络请求。

处理顺序是关键设计。

allowed_tools是权限名单，最先检查。

不在权限名单的工具直接拒绝。

这些工具永远不会被探测。

tools是探测范围名单，第二检查。

不在探测范围的工具直接放行，原因代码是"typesafe.tool_not_probed"。

顺序不能颠倒。

颠倒的话，范围外工具会继承一个不该有的允许。

然后是状态构建。

参数必须能严格序列化成JSON。

严格JSON的要求如下。

不允许default参数。

不允许NaN。

只允许字符串键。

参数无法序列化时本地拒绝，原因代码是"typesafe.state_unusable"。

不会截断参数后发送。

不会基于前缀做判断。

参数文本超过max_state_chars也本地拒绝。

max_state_chars是字符数不是字节数。

一个CJK字符是三个UTF-8字节。

字节限制会移动原本的回退边界。

### 5、_state方法

这个方法构造发送给TypeSafe的状态。

状态格式是tool_call对象加name和arguments两个字段。

### 6、_recorded_answer方法

这个方法提取本provider的唯一答案。

这个provider只问一个问题。

问题级失败意味着没有裁决。

所以问题级失败被映射回TypeSafeGuardrailError。

这和memory场景不同。

memory场景可以按问题回退。

### 7、_decide_from_answer方法

这个方法把概率转成决定。

概率小于threshold就放行。

概率达到threshold就拒绝。

结果写入缓存。

### 8、缓存方法

缓存键是工具名加参数文本的二元组。

缓存值是_CacheEntry。

缓存过期用pop(key, None)删除。

这里不能用裸del。

原因是同步评估可能在执行器线程上跑。

另一个线程可能已经删除了同一条过期条目。

裸del会抛KeyError。

KeyError会被Middleware当成提供者错误。

在fail_closed下会变成虚假拒绝。

缓存超容量时淘汰最老条目。

### 9、_strict_json_failure函数

这个模块级函数预检JSON序列化问题。

json.dumps会默默把非字符串键转成字符串。

这会让不同调用碰撞。

所以非字符串键在这里检查并返回TypeError。

非有限的float在这里返回ValueError。

循环引用也在这里检出。

### 10、_tool_names函数

这个函数解析工具名单。

None表示未配置。

空列表表示配置了空集合。

这个区分和AllowlistProvider相同。

真值测试会把空列表折叠成None并fail-open。

### 11、TypeSafeGuardrailError

这是本provider的异常类型。

共享的请求级错误类别原样透传。

本provider自己的问题级失败也报invalid_response。

原因是信封可用而这个答案不可用。

Middleware把这个异常映射到fail_closed策略。

这个异常永远不会被降级成允许。

### 12、内部数据类

- _Answer保存概率和模型名。
- _Probe保存一次值得发送的调用，包括工具名、参数文本和状态摘要。
- _CacheEntry保存允许与否、概率、模型、摘要和过期时间。

## 三、它和谁协作

- GuardrailProvider是它实现的契约。
- GuardrailMiddleware调用它并把它的错误映射到fail_closed。
- TypeSafeClient是共享传输客户端，在typesafe/client.py。
- TypeSafeConnection和resolve_connection负责连接配置解析。
- typesafe_defaults提供顶层typesafe块的默认值。
- recordable_model把服务端返回的模型名约束成可记录的token。
- RunJournal通过Middleware记录它的拒绝决定。

## 四、重要性评级

评级是8分。

理由如下。

这个类是语义级风险门禁。

名单门禁只能按名字拦截。

这个门禁能按调用内容判断风险。

它处理了大量对抗性细节。

严格JSON防止键碰撞。

字符数上限防止边界移动。

缓存并发删除防止虚假拒绝。

凭证绝不进入日志。

模型名约束成摘要。

这些都直接影响安全正确性。

扣掉2分。

扣分原因是它依赖外部TypeSafe服务。
