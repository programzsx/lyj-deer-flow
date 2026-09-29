# LoadedExtensions档案

源码位置：backend/packages/harness/deerflow/extensions/registry.py

## 一、这个类是干什么的

LoadedExtensions是运行期消费的不可变扩展快照。

ExtensionRegistry是注册阶段的可变容器。注册完成后build方法产出LoadedExtensions。从此运行期只读这个快照。快照不可变。

LoadedExtensions按贡献类型分桶存放。每个桶是一个二元组元组。每个元素是（来源字符串，贡献对象）。

来源字符串的用处是这样的。诊断、来源追溯、排序错误都能指名是哪个扩展的责任。

LoadedExtensions还带几个预计算的布尔字段。这些字段让hook调用点可以读一个属性做短路。零扩展的路径什么都不用构造。预计算是属性而不是方法。原因是调用点读一个属性就够了。

LoadedExtensions有一个模块级共享空实例EMPTY_EXTENSIONS。这个实例给不加载任何扩展的宿主用。

## 二、类的成员

（一）字段

- app_store：ExtensionData任务存储。
- middleware_contributors：中间件贡献者元组。
- task_lifecycle：任务生命周期贡献者元组。
- system_model_observers：系统模型调用观察者元组。
- agent_assembly_observers：Agent组装观察者元组。
- context_compaction_observers：上下文压缩观察者元组。
- services：Gateway服务元组。
- routers：HTTP路由器元组。
- plugins：全栈插件贡献元组。

（二）预计算布尔字段

- has_middleware_contributors：是否有中间件贡献者。
- has_task_lifecycle：是否有任务生命周期贡献者。
- has_system_model_observers：是否有系统模型观察者。
- has_agent_assembly_observers：是否有Agent组装观察者。
- needs_task_store：是否需要ExtensionData任务存储。中间件、生命周期、系统调用、压缩观察任一注册就需要。

## 三、它和谁协作

（一）产出者

ExtensionRegistry的build方法产出LoadedExtensions。

（二）消费者

stack.py的compose_with_extensions消费它。runtime启动消费它。SubagentExecutor在构造时绑定它。

## 四、重要性评级

评级：7分。

理由：LoadedExtensions是扩展系统的运行期数据总线。所有扩展贡献通过它流向宿主。预计算布尔字段避免了零扩展路径的开销。不可变设计保证了运行期安全。它是数据快照，不承载行为逻辑。给7分。
