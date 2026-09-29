# ModelMessage档案

一、这个类是干什么的

ModelMessage是模型调用消息的数据类。一个消息有角色和文本内容。这个类是frozen dataclass。

二、类的成员

（一）字段

- role：字面量。取值是system、user或assistant。这个字段是消息的角色。
- content：字符串。这个字段是消息的文本内容。

（二）方法

这个类没有自定义方法。这个类是纯数据类。

三、它和谁协作

ModelInvocationRequest的messages字段是这个类的序列。ModelInvoker消费这个类。

四、重要性评级

评级：4分。

理由：这个类是模型调用的消息载体。只有两个字段。所以重要性偏低。
