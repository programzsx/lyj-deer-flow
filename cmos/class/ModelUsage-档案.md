# ModelUsage档案

一、这个类是干什么的

ModelUsage是模型调用用量统计的数据类。这个类记录一次调用的token消耗。这个类是frozen dataclass。

二、类的成员

（一）字段

- input_tokens：整数或None。默认值是None。这个字段是输入token数。
- output_tokens：整数或None。默认值是None。这个字段是输出token数。
- total_tokens：整数或None。默认值是None。这个字段是总token数。

（二）方法

这个类没有自定义方法。这个类是纯数据类。

三、它和谁协作

ModelInvocationResult的usage字段是这个类的实例。扩展用它统计成本。

四、重要性评级

评级：3分。

理由：这个类只有三个统计字段。是用量数据的载体。所以重要性低。
