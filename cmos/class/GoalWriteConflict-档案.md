# GoalWriteConflict档案

源码位置：`backend/packages/harness/deerflow/runtime/goal.py`

## 一、这个类是干什么的

这个类是一个异常类。

这个类继承`RuntimeError`。

这个类表示"目标写入基于了过期的检查点"。

目标状态存在检查点里。

写入目标是读改写序列。

先读当前检查点。

再改。

再写回。

读和写之间检查点可能被别人改了。

另一个运行、另一个worker都可能写检查点。

写回时会覆盖别人的改动。

`write_thread_goal`支持乐观并发检查。

调用方传入`expected_checkpoint_id`。

写之前重新读检查点。

id对不上。

说明检查点变了。

代码抛出这个异常。

错误消息是"Thread {thread_id} goal checkpoint changed while preparing write"。

调用方可以重试整个读改写序列。

这个异常配合`goal_thread_lock`使用。

锁保证同一事件循环内串行。

乐观检查兜底跨场景的竞态。

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

捕获后可以重试读改写序列。

不会误捕其他`RuntimeError`。

## 三、它和谁协作

这个类和`write_thread_goal`协作。

写入函数在`expected_checkpoint_id`和实际id对不上时抛出这个异常。

这个类和`goal_thread_lock`协作。

`goal_thread_lock`用`AsyncKeyedLockTable`按thread_id串行化。

锁减少冲突。

乐观检查兜底残余竞态。

两者配合保证goal读改写的正确性。

这个类和Gateway的目标服务协作。

`set_goal`、`clear_goal`在冲突时捕获这个异常。

可以重试。

## 四、重要性评级

评级：2分（满分10分）。

理由：

- 这个类是异常类。
- 没有任何逻辑。
- 异常类评2到3分。
- 它承载的语义是乐观并发控制。
- 没有它，过期的写入会静默覆盖别人的改动。
- 目标状态会丢失更新。
- 这个异常让冲突显式化。
- 调用方可以安全重试。
- 但异常类本身代码量几乎为零。
- 真正的检查逻辑在写入函数里。
- 评2分。
