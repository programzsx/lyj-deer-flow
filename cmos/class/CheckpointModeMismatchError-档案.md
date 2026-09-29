# CheckpointModeMismatchError档案

源码位置：`backend/packages/harness/deerflow/runtime/checkpoint_mode.py`

## 一、这个类是干什么的

这个类是一个异常类。

这个类继承`RuntimeError`。

这个类表示"检查点模式不匹配"。

检查点存储有两种通道模式。

`full`模式存整个快照的通道值。

`delta`模式存哨兵加每步写入。

模式在agent构建时被冻结在进程里。

full模式的进程打开一个delta模式的线程时。

代码会抛出这个异常。

而不是悄悄把空状态当作真实状态用。

这是fail-closed的设计。

错误消息是"Thread requires delta mode; materialize and convert its checkpoints before using full mode."

调用方需要先把检查点物化并转换。

才能用full模式。

这个异常由两个门函数抛出。

`raise_if_snapshot_incompatible`在读路径上抛。

`raise_if_checkpoint_tuple_incompatible`在原始元数据读取和写前检查上抛。

Gateway的threads路由把这个异常映射成HTTP 409。

响应里带原因和thread_id。

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

`except CheckpointModeMismatchError`只捕获模式不匹配。

不会误捕其他`RuntimeError`。

## 三、它和谁协作

这个类和checkpoint_mode模块的门函数协作。

`raise_if_snapshot_incompatible`、`raise_if_checkpoint_tuple_incompatible`、`ensure_checkpoint_mode_compatible`、`aensure_checkpoint_mode_compatible`。

这些函数在条件满足时抛出这个异常。

这个类和CheckpointStateAccessor协作。

访问器的每个get、update、history操作都过兼容门。

门发现full模式进程读了delta线程。

就抛这个异常。

这个类和Gateway的threads路由协作。

路由捕获这个异常。

映射成HTTP 409。

带上原因和thread_id返回给前端。

## 四、重要性评级

评级：2分（满分10分）。

理由：

- 这个类是异常类。
- 没有任何逻辑。
- 只有一个docstring。
- 异常类评2到3分。
- 它承载的fail-closed语义很重要。
- full模式直接读delta检查点会悄悄拿到空消息列表。
- 用户会以为历史丢了。
- 这个异常把静默错误变成显式失败。
- 但异常类本身代码量几乎为零。
- 真正的逻辑在门函数里。
- 评2分。
