# RunManager-档案

## 一、这个类是干什么的

RunManager是runtime/runs/manager.py里的类。

它是内存运行注册表。

带可选的持久RunStore支持。

它是Gateway运行生命周期的核心。

它管理运行的创建、启动、状态、取消、恢复。

它处理多worker的运行所有权。

它处理幂等准入。

这个类非常大。约2000行。

这个类位于backend/packages/harness/deerflow/runtime/runs/manager.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、RunRecord数据类

这是单个运行的可变记录。

字段包括run_id、thread_id、assistant_id、status、on_disconnect、operation_kind、multitask_strategy、metadata、kwargs、user_id、时间戳、task、start_lock、abort_event、error、model_name、token用量字段、message_count、owner_worker_id、lease_expires_at、ownership_lost、stop_reason、idempotency_key、idempotency_reused。

- ownership_lost是进程局部fencing信号。设置后这个worker不能再做持久run或thread终结。它的租约所有权已知丢失或过期前无法确认。
- idempotency_reused只在恢复已有幂等准入的调用方上为True。那个调用方不能把第二个worker附加到持久运行。

### 2、PersistenceRetryPolicy

短run store写入的有界重试策略。

最多5次尝试。初始延迟0.05秒。最大1秒。退避因子2。

### 3、RunStatus和RunStartOutcome

RunStatus是运行状态枚举。

RunStartOutcome是pending到running启动屏障的结果。started或cancelled。

### 4、create方法

创建运行记录。

### 5、_admit_thread_operation方法

这是线程操作准入的核心。

它处理幂等键复用。

冲突时复用已有运行。

### 6、try_start方法

pending到running的启动屏障。

### 7、cancel方法

取消运行。

_request_durable_cancel写持久取消。

_signal_local_cancel发本地取消信号。

### 8、reconcile_orphaned_inflight_runs方法

孤儿运行恢复。

Gateway重启前没到持久终态的运行被恢复。

ORPHAN_RECOVERY_STOP_REASON和错误常量在这里定义。

### 9、租约所有权

_compute_lease_expires_at计算租约过期。

owner_worker_id和lease_expires_at支撑多worker所有权。

### 10、SQLite重试

可重试的SQLite错误包括database is locked等。

_is_retryable_persistence_error判断。

### 11、唯一约束信号

Driver原生的唯一约束信号跨驱动和SQLAlchemy版本稳定。

Postgres的23505和SQLite的UNIQUE错误码。

### 12、_persist_status方法

持久化状态。带重试。

### 13、reserve_thread_operation方法

保留线程操作。手动compaction和状态更新用它。

短命的checkpoint_write线程操作共享持久的活动线程唯一约束。

防止checkpoint-write竞争。

## 三、它和谁协作

- RunStore是持久支持。
- worker.py运行代理并更新状态。
- RunJournal写token用量。
- sse_consumer订阅流。
- persistence的run表是SQL后端。

## 四、重要性评级

评级是10分。

理由如下。

RunManager是运行生命周期的核心。

它管理内存注册表加持久store。

它处理多worker所有权、租约、fencing、幂等、孤儿恢复、取消。

ownership_lost的fencing信号防止丢失租约的worker继续终结。

幂等准入复用防止重复运行。

SQLite重试处理锁竞争。

孤儿恢复处理Gateway重启。

它是Gateway运行可靠性的基石。

满分10分。
