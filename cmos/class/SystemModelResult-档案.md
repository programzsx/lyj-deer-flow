# SystemModelResult档案

一、这个类是干什么的

SystemModelResult是宿主自有模型调用后的快照数据类。快照记录成功或失败。观察者在调用后收到。这个类是frozen dataclass。

二、类的成员

（一）字段

- response：Any或None。默认值是None。这个字段是调用的响应。失败时为None。
- error：BaseException或None。默认值是None。这个字段是失败的异常。成功时为None。
- duration_ms：浮点数或None。默认值是None。这个字段是调用的耗时毫秒数。

（二）方法

这个类没有自定义方法。这个类是纯数据类。

三、它和谁协作

SystemModelCallObserver的on_system_model_call回调接收这个类。宿主在系统模型调用后构造快照。

四、重要性评级

评级：4分。

理由：这个类是系统调用结果的载体。只有三个字段。所以重要性偏低。
