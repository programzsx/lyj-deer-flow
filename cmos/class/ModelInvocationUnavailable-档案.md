# ModelInvocationUnavailable档案

一、这个类是干什么的

ModelInvocationUnavailable是能力已停止或配置的模型不可用的异常类。这个类继承自ModelInvocationError。这个类表示模型调用能力当前不可用。

二、类的成员

（一）属性

这个类没有自定义属性。继承父类的消息机制。

（二）方法

这个类没有自定义方法。这个类是异常类型占位。

三、它和谁协作

ModelInvocationError是父类。ModelInvoker的默认实现抛出这个类。表示宿主不支持模型调用能力。

四、重要性评级

评级：4分。

理由：这个类是错误类型细分的一种。单独存在意义有限。扩展按类型区分处理。所以重要性偏低。
