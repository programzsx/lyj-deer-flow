# CheckpointDeltaConfig档案

一、这个类是干什么的

CheckpointDeltaConfig是增量检查点模式的调优配置类。这个类只在checkpoint_channel_mode为delta时生效。full模式下被忽略。这个类控制快照的节奏。这个类继承自pydantic的BaseModel。

二、类的成员

（一）字段

- snapshot_frequency：整数。默认值是10。最小值是1。这个字段是DeltaChannel的快照节奏。每N次每步写入存储一次完整messages快照。值越大检查点越小。物化越慢。这个值要求重启。共享同一个检查点数据库的所有进程必须用相同的值。快照节奏被烧进每个编译图的channel表。不是存在检查点里。

（二）方法

这个类没有自定义方法。这个类只有一个字段。

三、它和谁协作

DatabaseConfig持有这个类。DatabaseConfig的checkpoint_delta字段是这个类的实例。只有delta模式使用它。DatabaseConfig的旧键迁移逻辑会把顶层checkpoint_delta_snapshot_frequency搬到这个字段。

四、重要性评级

评级：4分。

理由：这个类只在delta模式生效。字段只有一个。模式匹配错误会导致不同进程对同一线程应用不同节奏。但默认模式是full。所以重要性偏低。
