# ModelInvoker档案

一、这个类是干什么的

ModelInvoker是模型调用能力的协议类。这个类是Protocol。宿主授予扩展这个能力。扩展用它做提供者中立的非流式文本模型调用。这个类定义一个方法。

二、类的成员

（一）方法

- invoke(request)：异步方法。执行一次调用。带schema的请求只在有校验后的对象数据时成功。调用者取消传播成asyncio.CancelledError。超时抛ModelInvocationFailed。默认实现抛ModelInvocationUnavailable。表示宿主不支持。

三、它和谁协作

ModelInvocationRequest是这个方法的参数。ModelInvocationResult是返回类型。ExtensionRuntimeDeps的model_invoker字段是这个协议的实例。宿主在基础设施就绪后注入。

四、重要性评级

评级：6分。

理由：这个协议是扩展获得模型能力的唯一入口。错误语义规范化。取消和超时行为明确。所以重要性中等偏上。
