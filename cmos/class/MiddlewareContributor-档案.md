# MiddlewareContributor档案

一、这个类是干什么的

MiddlewareContributor是中间件贡献者的协议类。这个类是Protocol。实现这个协议的扩展可以给宿主的中间件栈贡献中间件。这个类定义一个方法。

二、类的成员

（一）方法

- contribute_middlewares(app_store, ctx)：同步方法。代理构建时宿主调用。app_store是ExtensionData。ctx是AgentBuildContext。返回MiddlewarePlacement的序列。默认实现返回空元组。保证向后兼容。

三、它和谁协作

ExtensionRegistry的middlewares方法接收实现这个协议的对象。AgentBuildContext和MiddlewarePlacement是它的输入输出类型。宿主在代理构建时调用。

四、重要性评级

评级：5分。

理由：这个协议是扩展给代理加中间件的唯一入口。位置和范围语义靠返回值表达。所以重要性中等。
