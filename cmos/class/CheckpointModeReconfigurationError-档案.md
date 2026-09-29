# CheckpointModeReconfigurationError档案

源码位置：`backend/packages/harness/deerflow/runtime/checkpoint_mode.py`

## 一、这个类是干什么的

这个类是一个异常类。

这个类继承`RuntimeError`。

这个类表示"检查点模式被热切换"。

检查点通道模式是restart-required的配置。

模式在进程里只能冻结一次。

`freeze_checkpoint_channel_mode`第一次冻结模式。

后续再冻结一个不同的模式时。

代码抛出这个异常。

同样的规则也适用于快照频率。

`freeze_checkpoint_snapshot_frequency`冻结delta快照的节奏。

后续冻结一个不同的频率时。

也抛这个异常。

配置要改模式必须重启进程。

运行中的进程不允许改。

错误消息说明这是restart-required的配置。

这个异常是有意的防护。

共享同一个检查点数据库的所有进程。

模式和频率必须一致。

如果不一致。

一个进程写的检查点另一个进程读不懂。

这个异常在进程启动时就暴露问题。

而不是让数据损坏悄悄发生。

Gateway把这个异常映射成HTTP 503。

## 二、类的成员

### （一）字段

这个类没有自己的字段。

它继承`RuntimeError`的全部行为。

异常消息通过标准的`args`传递。

### （二）方法

这个类没有自己的方法。

它只是继承异常类的行为。

定义这个类的意义在于类型本身。

调用方可以精确捕获这一种失败。

## 三、它和谁协作

这个类和`freeze_checkpoint_channel_mode`协作。

模式冻结函数发现后续冻结的模式和已冻结的不同。

就抛这个异常。

这个类和`freeze_checkpoint_snapshot_frequency`协作。

频率冻结函数发现后续冻结的频率和已冻结的不同。

也抛这个异常。

这个类和agent构建流程协作。

`make_lead_agent`和嵌入式的`DeerFlowClient`在编译图之前冻结模式。

第二个不同的模式或频率在同进程出现。

就抛这个异常。

这个类和Gateway错误映射协作。

这个异常映射成HTTP 503。

## 四、重要性评级

评级：2分（满分10分）。

理由：

- 这个类是异常类。
- 没有任何逻辑。
- 异常类评2到3分。
- 它承载的防护语义很重要。
- 模式和频率是进程级不变量。
- 共享同一个数据库的进程必须一致。
- 这个异常让配置漂移在启动时显式失败。
- 但异常类本身代码量几乎为零。
- 真正的检查逻辑在冻结函数里。
- 评2分。
