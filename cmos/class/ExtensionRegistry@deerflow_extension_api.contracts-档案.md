# ExtensionRegistry@deerflow_extension_api.contracts-档案.md

一、这个类是干什么的

ExtensionRegistry是扩展注册面的协议类。注意这个类名和deerflow.extensions.registry.py里的ExtensionRegistry重名。这里的版本是contracts.py里的协议。这个类是runtime_checkable的Protocol。这个类是install()拿到的只写注册面。扩展在install时用它注册自己的贡献。结构上刻意最小。宿主的具体注册表还携带宿主专有的机制。归因、位置回滚和构建。那些刻意不在这里。这个类不在本目录范围内。

二、类的成员

（一）方法

- plugin(contribution)：注册插件贡献。接受PluginContribution。返回True表示接受。False表示宿主不支持插件UI。默认实现返回False。
- middlewares(contributor)：注册中间件贡献者。接受MiddlewareContributor。默认实现返回None。
- task_lifecycle(contributor)：注册任务生命周期贡献者。接受TaskLifecycleContributor。默认实现返回None。
- system_model_observer(observer)：注册系统模型调用观察者。接受SystemModelCallObserver。默认实现返回None。
- agent_assembly_observer(observer)：注册代理装配观察者。接受AgentAssemblyObserver。默认实现返回None。
- context_compaction_observer(observer)：注册上下文压缩观察者。接受ContextCompactionObserver。默认实现返回None。
- service(service)：注册扩展服务。接受ExtensionService。默认实现返回None。
- routers(routers)：注册HTTP路由。路由在扩展install时急切构造。类型是Any让这个契约包不依赖FastAPI。宿主在挂载前校验。运行时资源应该放进服务。默认实现返回None。

每个方法都有默认实现。加新方法对旧的注册表实现保持兼容。

三、它和谁协作

ExtensionInstall类型定义了install函数的签名。每个扩展暴露一个接收这个注册表的install函数。PluginContribution和各观察者协议是这个类的方法参数类型。宿主的具体注册表实现这个协议。

四、重要性评级

评级：8分。

理由：这个协议是扩展体系的注册入口。所有贡献都通过它进入宿主。最小结构保证了兼容性。所以重要性高。
