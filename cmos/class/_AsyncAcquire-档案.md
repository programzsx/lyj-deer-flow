# _AsyncAcquire档案

源码位置：backend/packages/harness/deerflow/sandbox/acquire_serialization.py

## 一、这个类是干什么的

_AsyncAcquire是一次异步锁获取的交接状态。

_AsyncAcquire处理事件循环和获取worker之间的竞态安全所有权交接。

场景是这样的。异步持有者等待锁。锁获取跑在专用executor的worker线程里。等待期间调用者可能被取消。取消后谁负责释放锁、谁负责清理表项，需要精确交接。

_AsyncAcquire记录三个标志。abandoned表示调用者已抛弃。acquired表示worker已拿到锁。cleaned表示已清理。_mark_cleaned保证清理只发生一次。

交接的行为有这些。

run是worker入口。worker拿锁。拿锁后发现已abandoned就自己释放锁并清理。

abandon是调用者取消时调用。如果worker已拿锁，调用者标记清理。worker自己还没拿锁的话，worker拿锁后发现abandoned自己释放。

cancel_queued处理executor任务在worker启动前被取消的情况。

release是正常释放。锁没持有时抛RuntimeError。这表明内部所有权bug。

## 二、类的成员

（一）字段

- _entry：锁表项。
- _cleanup：清理回调。
- _state_lock：状态锁。
- _abandoned：调用者是否已抛弃。
- _acquired：worker是否已拿锁。
- _cleaned：是否已清理。

（二）方法

- run：worker入口。拿锁。发现abandoned就自己清理。
- abandon：调用者取消时标记抛弃。
- cancel_queued：清理在worker启动前被取消的任务。
- worker_done：executor关闭时回收被取消的任务。
- release：正常释放锁。
- _mark_cleaned：标记清理。只发生一次。

## 三、它和谁协作

（一）使用者

AcquireSerializer的hold_async创建_AsyncAcquire。hold_async的取消处理调用abandon和cancel_queued。正常退出调用release。

## 四、重要性评级

评级：4分。

理由：_AsyncAcquire解决的是异步锁获取的取消竞态问题。三种标志加一次性的清理保证锁不会被泄漏、不会被双重释放。这是并发正确性的关键部件。它是内部辅助类。给4分。
