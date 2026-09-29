# ModelInvocationError档案

一、这个类是干什么的

ModelInvocationError是模型调用错误的规范化异常类。这个类继承自RuntimeError。这个类是所有模型调用错误的基础类。宿主抛出这个类的子类。异常里不含提供者异常或凭据。

二、类的成员

（一）属性

这个类没有自定义属性。继承RuntimeError的消息机制。

（二）方法

这个类没有自定义方法。这个类是异常类型占位。

三、它和谁协作

ModelInvocationUnavailable、ModelInvocationUnauthorized和ModelInvocationFailed继承这个类。ModelInvoker的invoke方法在失败时抛出这个类族的异常。扩展捕获这个类做统一处理。

四、重要性评级

评级：5分。

理由：这个类是扩展处理模型调用错误的统一入口。规范化保证不泄露凭据。所以重要性中等。
