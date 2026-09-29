# InvalidRunEvidenceCursor档案

一、这个类是干什么的

InvalidRunEvidenceCursor是无效游标的异常类。这个类继承自ValueError。这个类表示游标格式错误、不受支持或属于别的作用域。

二、类的成员

（一）属性

这个类没有自定义属性。继承ValueError的消息机制。

（二）方法

这个类没有自定义方法。这个类是异常类型占位。

三、它和谁协作

RunEvidenceReader的实现读到无效游标时抛出这个类。扩展捕获后可以把游标错误转成HTTP 400。

四、重要性评级

评级：4分。

理由：这个类是游标错误的类型标记。单独存在意义有限。所以重要性偏低。
