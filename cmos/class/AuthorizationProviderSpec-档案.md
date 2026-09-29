# AuthorizationProviderSpec-档案

# 一、这个类是干什么的

AuthorizationProviderSpec定义在`backend/packages/harness/deerflow/authz/runtime.py`。

这个类表示"一个已发现的提供者类和它的构造参数"。

模块docstring说明这个文件是提供者工厂。

工厂负责发现并构造配置的提供者。

工厂把工作拆成两个阶段。

第一阶段是"发现"。第一阶段根据类路径找到提供者类。第一阶段不构造实例。

第二阶段是"构造"。第二阶段用第一阶段的结果构造实例并校验。

AuthorizationProviderSpec就是两个阶段之间的"交接物"。

第一阶段产出这个对象。

第二阶段消费这个对象。

为什么要拆两阶段。

docstring解释了原因。

异步调用方需要把类路径的发现和导入移出事件循环。导入自定义模块可能阻塞。

构造要留在调用方的事件循环上。因为合法的异步提供者可能在`__init__`里创建依赖事件循环的客户端。

这个类是`frozen`的dataclass。这个类创建后不能修改。

这个类还用了`slots=True`。这个类内存占用小。

# 二、类的成员（字段、方法，各自做什么）

## （一）字段

- `class_path`：提供者的类路径。类型是`str`。例如`"deerflow.authz.rbac.RbacAuthorizationProvider"`。这是配置里`authorization.provider.use`的值。
- `provider_cls`：已解析的提供者类。类型是`type[Any]`。这是类路径导入后的实际类对象。
- `kwargs`：构造参数字典。类型是`dict[str, Any]`。这来自配置里`authorization.provider.config`。构造实例时展开这些参数。

## （二）方法

这个类没有定义任何业务方法。

这个类是`frozen`数据类。这个类只装数据。

创建它的函数是`resolve_authorization_provider_spec`。

消费它的函数是`construct_authorization_provider`。

# 三、它和谁协作

这个类是工厂两阶段之间的交接物。

协作关系如下。

`resolve_authorization_provider_spec`函数创建这个对象。这个函数发现提供者类。这个函数可能导入自定义模块。导入可以移到工作线程。函数返回`None`表示授权未启用。

`construct_authorization_provider`函数消费这个对象。这个函数用`spec.provider_cls(**spec.kwargs)`构造实例。构造后校验实例满足`AuthorizationProvider`协议。RBAC提供者还会校验`default_role`。

`resolve_authorization_provider`函数组合两个阶段。这个便捷函数先发现再构造。同步调用方用这个函数。

`plugin_authz.py`里的`_aresolve_provider`也使用这个对象。异步路径用`asyncio.to_thread`把发现阶段移出事件循环。构造阶段留在事件循环上。

组合关系上，这个类持有提供者类对象和构造参数。

这个类依赖`AuthorizationProvider`协议做类型约定。

这个类是被传递的数据载体。

# 四、重要性评级（1-10分+理由）

评级：5分。

理由如下。

这个类是工厂两阶段设计的中转结构。

没有它，两阶段拆分需要一个别的传递方式。

它的存在让"发现"和"构造"可以分开调度。

异步调用方受益。发现移出事件循环。构造留在事件循环。

但是这个类是纯内部数据载体。

这个类只有三个字段。

这个类没有任何行为。

删掉它，工厂函数可以返回`（类，参数）`元组。改动范围小。

依赖它的只有`runtime.py`里的三个函数和`plugin_authz.py`的一个函数。

使用面窄。使用面窄所以分数不高。

但它的设计意图清晰。它支撑了正确的异步调度。设计价值大于体量价值。

所以给5分。
