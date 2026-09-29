# ModelInvocationResult档案

一、这个类是干什么的

ModelInvocationResult是模型调用结果的数据类。宿主成功完成一次调用后返回这个类。这个类是frozen dataclass。

二、类的成员

（一）字段

- content：字符串。这个字段是调用的文本结果。
- structured_output：Mapping或None。默认值是None。这个字段是带schema请求的校验后对象。
- resolved_model：字符串或None。默认值是None。这个字段是实际服务的模型名。
- usage：ModelUsage或None。默认值是None。这个字段是调用的token用量。

（二）方法

这个类没有自定义方法。这个类是纯数据类。

三、它和谁协作

ModelInvoker的invoke方法返回这个类。ModelUsage是usage字段的类型。schema请求只在有校验后的对象数据时成功。

四、重要性评级

评级：5分。

理由：这个类是模型调用的返回载体。扩展消费它获取结果。所以重要性中等。
