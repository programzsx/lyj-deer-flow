# ModelInvocationFailed档案

一、这个类是干什么的

ModelInvocationFailed是调用失败、超过宿主限制或超时的异常类。这个类继承自ModelInvocationError。这个类表示调用本身失败了。

二、类的成员

（一）属性

这个类没有自定义属性。继承父类的消息机制。

（二）方法

这个类没有自定义方法。这个类是异常类型占位。

三、它和谁协作

ModelInvocationError是父类。ModelOutputValidationError继承这个类。超时包括等待宿主容量的时间。超时抛出这个类。

四、重要性评级

评级：4分。

理由：这个类是错误类型细分的一种。失败和不可用需要区分。所以重要性偏低。
