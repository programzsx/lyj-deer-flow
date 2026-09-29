# TaskOutcome档案

一、这个类是干什么的

TaskOutcome是任务结果的枚举类。这个类继承自StrEnum。这个类表示任务结束时的结果。

二、类的成员

（一）枚举值

- COMPLETED：值为completed。任务完成。
- ABORTED：值为aborted。任务中止。
- FAILED：值为failed。任务失败。

（二）方法

StrEnum提供的能力。没有自定义方法。

三、它和谁协作

TaskLifecycleContributor的on_task_stop回调接收这个枚举。宿主在任务结束时传入结果。

四、重要性评级

评级：3分。

理由：这个枚举只有三个值。是结果的简单标记。所以重要性低。
