# ExtensionService档案

一、这个类是干什么的

ExtensionService是扩展服务的协议类。这个类是Protocol。实现这个协议的扩展可以注册一个有生命周期的服务。服务启动时收到宿主能力。停止时清理。这个类定义两个方法。

二、类的成员

（一）方法

- start(deps)：异步方法。服务启动时宿主调用。deps是ExtensionRuntimeDeps。默认实现返回None。
- stop：异步方法。服务停止时宿主调用。默认实现返回None。

每个方法都有默认实现。加新方法对已发布的扩展保持向后兼容。

三、它和谁协作

ExtensionRegistry的service方法接收实现这个协议的对象。ExtensionRuntimeDeps是start方法的参数。运行时资源应该放在服务里。不是路由里。

四、重要性评级

评级：5分。

理由：这个协议是扩展有状态后台逻辑的标准容器。start和stop的语义清晰。所以重要性中等。
