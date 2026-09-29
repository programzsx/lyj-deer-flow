# ModelOutputValidationError档案

一、这个类是干什么的

ModelOutputValidationError是提供者输出无法解析或无法通过schema校验的异常类。这个类继承自ModelInvocationFailed。这个类是模型调用错误体系的最细分支。

二、类的成员

（一）属性

这个类没有自定义属性。继承父类的消息机制。

（二）方法

这个类没有自定义方法。这个类是异常类型占位。

三、它和谁协作

ModelInvocationFailed是父类。带response_schema的请求在校验失败时抛出这个类。

四、重要性评级

评级：4分。

理由：这个类是错误类型的最细分支。结构化输出失败时才抛出。所以重要性偏低。
