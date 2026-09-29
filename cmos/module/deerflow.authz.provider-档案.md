# deerflow.authz.provider-档案

## 一、这个模块是干什么的

这个文件是细粒度资源授权的协议和数据结构。

它是资源级授权的策略大脑。RBAC以及其他策略的基础。

它刻意作为guardrails的兄弟模块存在。没有折进guardrails里。

原因是这样的。之前的PR明确划定了guardrails的职责边界。guardrails只管执行时检查。不新增policy engine。不新增RBAC系统。这个模块就是那次被推迟的RBAC大脑。

授权提供者被两层执行。一层策略。

第一层是装配时的能力过滤。一个角色永远不会用的工具在绑定到agent之前就被移除。模型永远看不到它们。tool_search也无法把它们提升回来。这是fail-closed的。

第二层是运行时的执行拒绝。复用GuardrailMiddleware。通过一个薄adapter。见adapter.py。

## 二、模块里的主要成员

### 1、Principal数据类

这是执行者。从可信的运行时身份上下文解析出来。

字段有user_id、role、oauth_provider、oauth_id、channel_user_id。

is_internal标记内部调用。

attributes是附加属性字典。

字段镜像Gateway已经写进运行上下文的身份形状。第一层和执行层的adapter都用build_principal_from_context构建。adapter每次请求重建。从不缓存过期的运行时身份。

### 2、AuthzRequest数据类

这是每次授权检查传给提供者的上下文。

principal是执行者。

resource是资源类型。比如tool、model、skill、sandbox、mcp_server、route。

action是资源上的动作。比如call、list、use、activate、execute、read、write。

target是资源标识。工具名、模型名、技能名、route:threads:read这些。

context是附加上下文。thread_id、run_id、tool_call_id、tool_input、is_subagent这些。

### 3、AuthzReason数据类

这是allow或deny决策的结构化原因。

code是机器可读的码。message是人类可读的说明。

### 4、AuthzDecision数据类

这是提供者的allow或deny判决。

allow是布尔。reasons是原因列表。policy_id是策略标识。metadata是附加元数据。

### 5、AuthorizationProvider协议

这是可插拔授权的契约。

它是runtime_checkable的Protocol。任何有这些方法的类都行。不需要基类。

提供者通过类路径加载。用resolve_variable。和模型、工具、沙箱、护栏用同一个机制。

resource、action、target是自由字符串。不是枚举。新的资源类型不需要改schema。内置的RBAC提供者解释它们。自定义提供者自己定义。

三个方法。

authorize做单次判决。喂第二层执行和路由检查。

aauthorize是异步变体。

filter_resources是第一层的批量可见性过滤。装配时调用。返回候选里允许的子集。这是必须的方法。没有静态角色映射的提供者应该逐项调authorize。返回允许的子集。有静态映射的提供者可以重写。O(1)过滤。

答案只能收窄候选。每个调用方都把它和请求的列表求交集。命名一个从未是候选的目标不会授予任何东西。

实现必须线程安全。异步调用方把这个同步方法放到worker线程。所以它可能在事件循环继续服务其他工作时运行。

## 三、它和谁协作

它被authz.principal引用。principal构建Principal实例。

它被authz.rbac实现。rbac是内置提供者。

它被authz.adapter引用。adapter把它适配成GuardrailProvider。

它被authz.enforcement引用。enforcement用它过滤工具。

它被authz.runtime引用。runtime按类路径解析提供者。

它被authz.sandbox_authz和authz.plugin_authz引用。

## 四、重要性评级

评级是8分。

理由是这个文件是授权体系的契约核心。

Principal、请求、判决全部定义在这里。

两层执行的设计让一份策略同时保护装配时和运行时。

Protocol加自由字符串的设计让自定义提供者不需要改schema。

不评更高分是因为它只有协议和数据结构。决策逻辑在rbac和adapter里。
