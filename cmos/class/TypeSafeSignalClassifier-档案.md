# TypeSafeSignalClassifier档案

## 一、这个类是干什么的

这个类是TypeSafe信号分类器。

这个类的作用是把一批对话的认可和拒绝概率转成提示标签。

这个类回答的问题是"这批对话是否明确认可或拒绝了用户之前的偏好"。

这个类位于backend/packages/harness/deerflow/agents/memory/signals/typesafe.py。

源文件的模块说明说，这个类是TypeSafe（Jev）信号分类器。这个类对每一批对话问两个独立的问题。第一个问题是文本是否**明确认可**了用户之前说过的偏好、约束或做法。第二个问题是文本是否**明确拒绝或反转**了用户之前说过的偏好、约束或做法。两个问题的答案映射成`reinforcement`和`correction`标签。

这个类拥有的东西包括下面这些。两个问题和它们的评分标准。`hint_threshold`阈值。标签映射规则。自己的以`digest`为键的缓存。被询问模型版本的审计策略。

这个类永远不决定抽取。永远不驱动删除。这两条是模块说明里写死的约束。

`mode`参数被记录用于策略身份。`mode`参数不改变这个类的行为。模式决定标签是被消费、只记录、还是被忽略。这是设计文档§2.2.4的内容。

这个类实现了MemorySignalProvider协议。这个类也符合CombinableClassifier协议。协调器能把它当分类侧用，也能在合并模式下让它带请求。

## 二、类的成员（字段、方法，各自做什么）

这个类有三个类属性、一组实例配置和一组方法。

### 1、类属性

- `name`：值为`typesafe`。这是提供方名字。审计和失败日志用这个名字。
- `policy_id`：值为`deerflow.memory.signals.typesafe`。这是策略身份。
- `policy_version`：值为`1.0.0`。这是策略版本号。

### 2、构造方法

- `__init__`方法：输入是关键字参数。`mode`是模式，默认`shadow`。`api_key`和`api_key_env`是凭据。`base_url`和`model`是连接信息。`hint_threshold`是标签阈值，默认0.5。`instructions`和`criteria`是问题文本的覆盖项。`max_state_chars`是文本长度上限，默认6000。`timeout`、`deadline_seconds`、`max_attempts`、`retry_backoff`是传输配置。`cache_size`和`cache_ttl_seconds`是缓存配置。`transport_factory`是传输工厂。

  构造时做下面几件事。先校验`mode`合法性。再解析连接配置。再建TypeSafeClient。再校验阈值范围。再组装两个问题的文本。问题文本的来源有三个，配置覆盖、用户instructions、内置默认。再校验长度和缓存参数。再建自己的AnswerCache。

### 3、侧接口方法

- `questions`方法：无输入。返回问题映射。这个类有两个问题。问题类型是`noul`。每个问题带instructions和true/false评分标准。
- `ask`方法：输入是批次文本和问题映射。返回AnswerSet。这个方法拿文本的会话尾部状态发请求。
- `sharing_key`方法：输入是任意关键字参数。返回字符串。这是内部共享身份。包括凭据指纹、连接、限制和缓存。
- `interpret`方法：输入是答案映射，加`model`和`cached`关键字参数。返回MemorySignalDecision或None。这个方法把验证过的答案转成标签。认可答案有概率时，进`reinforcement`标签。拒绝答案有概率时，进`correction`标签。两个方向都没验证出来时，返回None。一个方向失败，另一个方向照样进结论。

### 4、身份方法

- `release_policy_parameters`方法：无输入。返回字典。声明影响行为的参数。包括模式、连接参数、阈值、两侧问题文本的哈希和评分标准、长度和缓存配置。凭据永远不进这个字典。

### 5、契约入口方法

- `decide`方法：输入是MemorySignalRequest。返回MemorySignalDecision或None。这是单侧路径的入口。先拿`digest`查缓存。答案齐全时直接解释缓存答案，标记为缓存命中。答案不齐时，发请求拿缺的方向。拿到验证过的答案后写回缓存，结论报告本次服务的模型，标记为非缓存。请求级失败抛TypeSafeError，让协调器记录`request_failed`。调用方退回确定性信号。

## 三、它和谁协作

这个类由解析函数生产。

`resolve_memory_signal_classifier`函数按配置加载这个类。配置的`use`字段写类路径。`build_memory_judge`函数调用解析函数。解析出来的实例交给MemorySignalCoordinator。

这个类由协调器消费。

协调器把它当MemorySignalProvider用。协调器调用`decide`发单侧请求。协调器也把它当CombinableClassifier用。合并模式下，协调器调用`questions`、`ask`和`interpret`。

上游依赖。这个类依赖judging模块的AnswerCache、CachedVerdict、conversation_tail_state。依赖contract.py的标签常量、模式常量、MemorySignalDecision、direction_labels。依赖typesafe包的TypeSafeClient、TypeSafeConnection、Question、Answer。依赖deerflow_extension_api的canonical_hash。

组合关系。这个类内部持有TypeSafeClient和TypeSafeConnection。内部持有两个_QuestionText对象。内部持有自己的AnswerCache。

配置热重载。这个类实现的连接身份是热重载失效签名的一部分。凭据轮换会让判官失效重建。

## 四、重要性评级

这个类的评级是6分。

理由如下。

这个类是信号分类侧的默认实现。协议是抽象的形状。这个类是真正干活的实体。模型请求由它发。标签由它映射。缓存由它维护。

这个类承载了标签映射的质量。两个问题的措辞和评分标准决定分类的准确性。设计文档说，`hints`模式的上线需要独立的人工评审数据集。这个类的问题文本就是评审对象。

删掉这个类，信号分类退回纯确定性规则。配置解析找不到实现，会大声报错。整个分类侧没有模型参与。

这个类的依赖面集中在judging体系内部。协调器通过协议使用它。外部代码不直接触碰它。

评级给6分。这个类是功能的实际提供者，但它是可选特性的一部分。两侧都关闭时，这个类不会被构造。
