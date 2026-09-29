# ModelInvocationUnauthorized档案

一、这个类是干什么的

ModelInvocationUnauthorized是请求的逻辑角色未授予此安装的异常类。这个类继承自ModelInvocationError。这个类表示请求的角色没有权限。

二、类的成员

（一）属性

这个类没有自定义属性。继承父类的消息机制。

（二）方法

这个类没有自定义方法。这个类是异常类型占位。

三、它和谁协作

ModelInvocationError是父类。宿主在请求的逻辑角色未授权时抛出这个类。扩展按类型区分处理。

四、重要性评级

评级：4分。

理由：这个类是错误类型细分的一种。授权错误需要和失败区分。所以重要性偏低。
