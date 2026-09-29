# AuthorizationProvider-档案

# 一、这个类是干什么的

AuthorizationProvider定义在`backend/packages/harness/deerflow/authz/provider.py`。

这个类不是普通类。这个类是一个Protocol（协议）。协议定义了一组方法约定。

任何类只要有这些方法。这个类就满足协议。任何类不需要继承任何基类。

模块docstring说明了这个模块的定位。

这个模块是资源级授权的"策略大脑"。资源级授权包括RBAC以及更细粒度的授权。

这个模块刻意和`deerflow.guardrails`保持兄弟关系。这个模块没有被合并进guardrails。

原因是PR#3665明确划定了guardrails的边界。guardrails只做执行时检查。guardrails不新增policy engine、RBAC系统、governance子系统。这个模块就是PR#3665推迟做的RBAC大脑。

这个类提供"可插拔的细粒度授权"契约。

提供者通过类路径加载。加载机制是`resolve_variable()`。

DeerFlow用同样的机制加载模型、工具、沙箱、guardrails。

这个协议支撑两层授权机制。两层机制共享一份策略。

第一层是组装时能力过滤。第一层在工具绑定到agent之前移除角色永远不能用的工具。模型永远看不到这些工具。`tool_search`也无法把它们找回来。这是fail-closed设计。

第二层是运行时执行拒绝。第二层复用`GuardrailMiddleware`。复用通过一个薄适配器（见`deerflow/authz/adapter.py`）。第二层能捕捉动态资源和基于参数的限制。

设计文档在`docs/plans/2026-07-10-pluggable-authorization-rfc.md`（issue#4063）。

# 二、类的成员（字段、方法，各自做什么）

## （一）字段

- `name`：提供者名称。类型是`str`。用于标识提供者。内置RBAC提供者的名字是`"rbac"`。

## （二）方法

- `authorize(request: AuthzRequest) -> AuthzDecision`：单次判断。输入是`AuthzRequest`。输出是`AuthzDecision`。这个方法服务于第二层（执行时判断）和路由检查。这是同步方法。
- `aauthorize(request: AuthzRequest) -> AuthzDecision`：异步版本的`authorize`。逻辑相同。异步调用方用这个方法。
- `filter_resources(principal, resource_type, candidates) -> list[str]`：第一层的批量可见性过滤。输入是操作者、资源类型、候选资源列表。输出是候选列表中允许的子集。这个方法是必需方法。没有静态角色到资源映射的提供者应该逐项委托给`authorize`。返回允许的子集。有静态映射的提供者可以覆盖这个方法。覆盖可以实现O(1)过滤和fail-closed可见性。

`filter_resources`有两条重要约束。

第一条约束是结果只能缩小候选列表。每个调用方会拿结果和自己询问的列表求交集。所以提供者返回一个从没被询问的目标不会带来任何授权。

第二条约束是实现必须线程安全。异步调用方会把这个同步方法丢到工作线程执行。执行期间事件循环继续服务其他工作。

# 三、它和谁协作

这个协议是授权体系的中心。

实现关系如下。

`RbacAuthorizationProvider`实现了这个协议。实现是隐式的。RBAC提供者有`name`、`authorize`、`aauthorize`、`filter_resources`，所以满足协议。RBAC提供者还带`@runtime_checkable`支持，运行时可以用`isinstance`检查。

消费关系如下。

`runtime.py`里的`construct_authorization_provider`用`isinstance`校验构建出来的实例。实例不满足协议就报`ValueError`。

`GuardrailAuthorizationAdapter`持有一个AuthorizationProvider实例。适配器把守卫请求转给提供者的`authorize`/`aauthorize`。

`plugin_authz.py`里的各个函数调用提供者。单点检查调用`authorize`/`aauthorize`。批量过滤调用`filter_resources`。

设计意图上，这个协议是扩展点。部署方可以写自己的提供者。自定义提供者通过`config.yaml`的类路径接入。

# 四、重要性评级（1-10分+理由）

评级：9分。

理由如下。

这个协议是整个授权体系的契约核心。

没有这个协议，就没有"可插拔授权"。

没有这个协议，RBAC提供者没有接口可遵循。

没有这个协议，自定义授权方案没有接入点。

这个协议支撑两层授权机制。第一层靠`filter_resources`。第二层靠`authorize`。

协议被运行时校验依赖。实例不满足协议就无法通过构建。

协议被适配器依赖。适配器把协议决策接到guardrails中间件。

协议被插件授权层依赖。插件资源的检查全部走这个协议。

删掉它，整个`authz`包会失去骨架。

依赖它的实现和调用方遍布授权链路。

评级不给满分，因为协议本身不含实现。真正执行判断的是具体提供者。但协议定义了系统的扩展契约。地位仅次于具体的判断逻辑。所以给9分。
