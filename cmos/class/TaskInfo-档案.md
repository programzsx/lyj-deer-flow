# TaskInfo档案

一、这个类是干什么的

TaskInfo是单个代理执行的身份信息数据类。执行可以是主代理或子代理。这个类是frozen dataclass。

二、类的成员

（一）字段

- task_id：字符串。这个字段是任务的ID。
- run_id：字符串。这个字段是运行的ID。
- thread_id：字符串。这个字段是线程的ID。
- kind：字面量。取值是lead或subagent。这个字段是执行的种类。
- parent_task_id：字符串或None。默认值是None。这个字段是父任务的ID。子代理才有。
- agent_name：字符串或None。默认值是None。这个字段是代理名。
- resumed：布尔值。默认值是False。这个字段表示执行是不是恢复的。

（二）方法

这个类没有自定义方法。这个类是纯数据类。

三、它和谁协作

TaskLifecycleContributor的on_task_start和on_task_stop回调接收这个类。宿主在任务开始和结束时构造这个类。

四、重要性评级

评级：4分。

理由：这个类是任务身份的载体。字段都是标识信息。所以重要性偏低。
