# deerflow.extensions.registry档案

## 一、这个模块是干什么的

这个模块是扩展系统的登记处。

第三方插件要接入DeerFlow。插件要向系统提供很多东西。比如中间件、路由、服务、观察器。这些提供的东西需要一个地方集中登记。这个模块就是那个集中登记的地方。

这个模块分成两半。

前一半是`ExtensionRegistry`类。这个类是登记阶段用的。插件在启动时调用这个类的方法。这个类把插件提供的东西收进来。收进来的东西带着来源标记。

后一半是`LoadedExtensions`类。这个类是运行阶段用的。登记结束后调用`build()`方法。这个方法把所有登记的东西冻结成一个不可变的快照。运行时读这个快照。运行时不再改这个快照。

这样设计有一个好处。登记阶段是可变的。运行阶段是不可变的。两个阶段的边界很清楚。运行代码拿到的是只读快照。快照里的每个条目都记着它来自哪个插件。出了问题能找到负责的插件。

## 二、模块里的主要成员

### 1、ExtensionRegistry类

这个类是可变的登记容器。只允许登记阶段使用。

这个类继承自公开契约`ExtensionRegistryContract`。继承的目的是做类型检查。插件看到的类型注解和宿主实现保持一致。宿主独有的机制（归属、回滚、构建）故意不放进公开契约。

这个类有八个登记桶。八个桶分别存放中间件贡献者、任务生命周期贡献者、系统模型调用观察器、代理组装观察器、上下文压缩观察器、服务、路由、插件。

这个类的主要方法有下面这些。

- `attributed_to(source)`，这是一个上下文管理器。在这个块里面登记的所有东西都归属到source这个名字。
- `plugin(contribution)`，登记一个全栈插件。这个方法做很严格的校验。检查插件契约版本必须是1。检查插件必须至少提供浏览器模块、后端动作或工具中的一种。检查工具名字必须唯一且格式合法。检查后端动作名字必须唯一。检查浏览器代码不超过512KiB。检查插件命名空间不能重复。
- `middlewares()`、`task_lifecycle()`、`system_model_observer()`、`agent_assembly_observer()`、`context_compaction_observer()`，这五个方法分别登记五种贡献者。都记录来源。
- `service(service)`，登记一个服务。如果登记块配置了模型调用授权，会把服务包上`ModelInvocationService`适配器。
- `routers(routers)`，登记路由。
- `discard(source)`，按来源字符串删除某个插件登记的所有东西。
- `mark()`和`rollback_to(mark)`，这是一对方法。`mark()`给八个桶的长度拍一个快照。`rollback_to()`按位置把快照之后登记的东西全部删掉。
- `build()`，构建出不可变的`LoadedExtensions`快照。

### 2、LoadedExtensions类

这个类是冻结的只读视图。运行时代码消费这个视图。

每个条目是一个元组。元组的第一项是来源字符串。第二项是贡献对象。来源字符串用来做诊断、溯源和排序报错。

这个类还带几个预计算的布尔属性。比如`has_middleware_contributors`、`needs_task_store`。这些是属性不是方法。钩子调用点读一个属性就能短路。零插件的路径不用构造任何东西。

### 3、EMPTY_EXTENSIONS常量

这是一个共享的空快照实例。给没有加载任何插件的宿主用。

### 4、discard和rollback_to的区别

这两个方法都做回滚。但语义不同。

`discard`按来源字符串匹配。这个方式不安全。两个插件配置可能共用同一个`use`入口但配置不同。按来源删除会把另一个成功安装的实例的登记也删掉。

`rollback_to`按位置删除。位置删除不会误伤。所以推荐用`mark`加`rollback_to`的组合。

## 三、它和谁协作

这个模块依赖`deerflow_extension_api`公开契约包。它实现的`ExtensionRegistryContract`和引用的各个贡献者类型都来自那个包。

这个模块依赖`deerflow.extensions.model_access`。`service()`方法用它的`ModelInvocationScope`和`ModelInvocationService`给服务包上模型调用授权。

这个模块被`deerflow.extensions.loader`调用。loader负责从配置解析插件入口、调用install函数。install函数拿到的就是`ExtensionRegistry`实例。登记完成后loader调用`build()`得到快照。

这个模块被`deerflow.extensions.__init__`调用。`reset_loaded_extensions()`用`ExtensionRegistry().build()`构造一个全新的空快照。

插件本身也调用这个模块。插件的`install(registry, config)`函数第一个参数就是这个类。

## 四、重要性评级

评级是9分。

理由。这个模块是整个扩展系统的中枢。所有插件贡献都从这里进出。没有这个模块，插件就没有登记入口。运行时也没有统一的只读快照可用。

这个模块的安全设计很关键。来源归属让每个贡献可追溯。mark加rollback的组合让半安装的插件不会污染系统。plugin方法的严格校验挡住了不合规的插件。这些设计直接关系到Gateway启动的安全和稳定。

扣一分的原因。这个模块本身不做加载和注入。它是被动的登记容器。真正的加载流程在loader里。所以它的重要性是核心但不是唯一入口。
