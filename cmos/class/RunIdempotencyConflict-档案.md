# RunIdempotencyConflict档案

源码位置：backend/packages/harness/deerflow/runtime/runs/store/base.py

## 一、这个类是干什么的

RunIdempotencyConflict是一个异常类。

RunIdempotencyConflict表示带相同进程级幂等键的运行已经存在。

背景是这样的。运行接纳支持幂等键。调用方用同一个幂等键重试接纳时。不应该创建第二个运行。应该复用已有的运行。存储发现键冲突时抛这个异常。

这个异常携带关键数据。异常带`existing`字段。existing是已存在运行的字典。里面有已有的run_id。

调用方捕获后做幂等复用。RunManager的reuse_idempotent_run用conflict.existing构建store_only的运行记录。返回给调用方。调用方拿到的是已有运行。不是新运行。

## 二、类的成员

（一）继承关系

RunIdempotencyConflict继承RuntimeError。

（二）字段

- `existing`：已存在运行的字典。包含已有run_id等信息。异常消息也引用这个字典的run_id。

（三）方法

- `__init__()`：接收existing字典。构造异常消息。消息说明幂等键已经属于哪个run_id。

## 三、它和谁协作

（一）RunStore

RunStore的原子接纳路径抛出这个异常。MemoryRunStore的create_thread_operation_atomic在幂等键匹配已有运行时抛。

（二）RunManager

RunManager的_admit_thread_operation捕获这个异常。捕获后调用reuse_idempotent_run做幂等复用。existing必须是同线程同用户的。不是的话抛RuntimeError。

（三）调度与恢复路径

调度服务的恢复路径用幂等键重试接纳。冲突异常触发复用已有运行。而不是创建新运行。

## 四、重要性评级

评级：3分。

理由：RunIdempotencyConflict是幂等接纳的关键信号。它携带existing数据。让重试路径能复用已有运行而不是白创建一个。幂等恢复全靠它。但它是个小异常类。只有一个字段。所以给3分。
