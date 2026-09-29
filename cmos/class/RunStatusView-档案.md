# RunStatusView档案

一、这个类是干什么的

RunStatusView是单个可见运行的权威生命周期投影数据类。这个类是frozen dataclass。

二、类的成员

（一）字段

- thread_id：字符串。默认值是空字符串。这个字段是线程ID。
- run_id：字符串。默认值是空字符串。这个字段是运行ID。
- status：字符串。默认值是空字符串。这个字段是运行状态。
- created_at：字符串。默认值是空字符串。这个字段是创建时间。
- updated_at：字符串。默认值是空字符串。这个字段是更新时间。
- error：字符串或None。默认值是None。这个字段是错误信息。
- stop_reason：字符串或None。默认值是None。这个字段是停止原因。

（二）方法

这个类没有自定义方法。这个类是纯数据类。

三、它和谁协作

RunEvidenceReader的get_run_status方法返回这个类。RunPage的items字段是这个类的元组。消费方把None当作运行不存在。

四、重要性评级

评级：5分。

理由：这个类是运行状态的权威投影。扩展同步运行状态靠它。所以重要性中等。
