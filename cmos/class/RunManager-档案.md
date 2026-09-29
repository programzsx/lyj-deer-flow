# RunManager档案

源码位置：backend/packages/harness/deerflow/runtime/runs/manager.py

## 一、这个类是干什么的

RunManager是运行管理的核心类。

RunManager负责一次运行（run）的完整生命周期。

RunManager管理的内容包括运行的创建、启动、取消、状态推进、持久化、孤儿恢复、关停清理。

RunManager内部维护一个内存注册表。注册表是`_runs`字典。键是run_id。值是RunRecord。

RunManager还有可选的持久化存储。存储是RunStore。提供了store之后，运行记录会写入存储。运行历史就能在进程重启后保留。

RunManager支持单worker模式和多worker模式。多worker模式开启心跳。心跳负责续租。租约过期后其他worker可以接管孤儿运行。

## 二、类的成员

（一）内部字段

- `_runs`：内存注册表。run_id到RunRecord的字典。只保存本worker接纳的运行。
- `_runs_by_thread`：二级索引。thread_id到run_id有序集合的映射。作用是按线程查询时不用全量扫描。
- `_lock`：asyncio锁。保护所有内存变更。
- `_store`：可选的RunStore持久化存储。
- `_persistence_retry_policy`：SQLite压力下的有界重试策略。
- `_worker_id`：本worker的唯一标识。格式是主机名加随机uuid。
- `_run_ownership_config`：运行所有权配置。控制心跳是否开启。
- `_event_store`：可选的运行事件存储。用于投递回执。
- `_heartbeat_task`和`_heartbeat_stop`：心跳后台任务及其停止信号。
- `_orphan_recovery_task`：周期性孤儿恢复任务。

（二）创建与接纳方法

- `create()`：创建一个pending状态的运行并注册。用`store.put`做upsert写入。生产调用方应该用`create_or_reject`。
- `create_or_reject()`：原子地接纳一个普通agent运行。内部走`_admit_thread_operation`。
- `_admit_thread_operation()`：接纳的核心实现。先查本线程有无活跃运行。reject策略遇到活跃运行会抛ConflictError。interrupt和rollback策略会先取消活跃运行再创建。写入store时用原子原语`create_thread_operation_atomic`。跨进程冲突由部分唯一索引兜底。支持幂等键复用已有运行。
- `reserve_thread_operation()`：为非运行类线程操作持有独占的持久化接纳。这是一个异步上下文管理器。用于checkpoint写等操作。退出时释放接纳。

（三）查询方法

- `get()`和`aget()`：按run_id查运行记录。内存没有就回退到store。store行会映射成store_only快照。快照不会注册进内存。
- `list_by_thread()`：按线程列运行。新的在前。支持keyset分页游标。内存和store结果合并后排序截断。
- `get_many_by_thread()`：批量加载选中运行。内存优先。
- `list_successful_regenerate_sources()`：返回被成功重新生成取代的源运行ID集合。这个查询不设上限。
- `list_edit_replay_visibility()`：返回编辑重跑的运行可见性规则。产出EditReplayVisibility。
- `has_inflight()`、`has_later_run()`、`has_later_started_run()`：线程内运行状态的快速判断。

（四）状态与持久化方法

- `try_start()`：把未取消的pending运行推进到running。这是启动屏障。返回RunStartOutcome。store启动失败会抛RunStartupError。
- `fail_start_if_pending()`：worker任务挂不上时把pending运行标记为error。
- `set_status()`：把运行推进到新状态。带持久化。
- `persist_current_status()`：把内存里已经改好的状态落库。
- `set_status_if_not_cancelled()`：设置终态。但如果持久化取消先赢就不设。
- `update_run_completion()`：把token用量和完成数据落库。带行恢复逻辑。
- `update_run_progress()`：落库一个运行中的快照。不改状态。
- `update_finalizing_progress()`：在durable行故意保持活跃时落库最终字段。
- `update_model_name()`：更新模型名。
- `set_finalizing()`：标记运行是否在做事后清理。
- `_persist_status()`和`_persist_snapshot_to_store()`：best-effort落库。失败会记日志不抛出。ownership_lost之后跳过写入。

（五）取消方法

- `cancel()`：请求取消一个运行。落在持有worker上时做本地取消。落在非持有worker上时走store路径。租约过期就接管。租约还有效就持久化取消请求。返回CancelOutcome枚举。
- `_signal_local_cancel()`：只设置进程内abort状态。不做状态落库和清理。
- `_request_durable_cancel()`和`_request_remote_cancel()`：把取消动作写入store。返回第一个赢的动作。

（六）所有权与心跳方法

- `_mark_ownership_lost()`：给一个本地运行上围栏。不再做durable收尾。取消执行任务。
- `start_heartbeat()`和`stop_heartbeat()`：启动和停止心跳后台任务。
- `_heartbeat_loop()`：周期性续租。每lease_seconds/3续一次。每lease_seconds做一次孤儿清扫。
- `_renew_leases()`：续本worker持有的租约。到期限还没确认成功就把本地运行上围栏。
- `reconcile_orphaned_inflight_runs()`：把租约过期的活跃运行标记为error。用带条件的原子claim防竞争。

（七）关停方法

- `shutdown()`：关停时取消并有限等待所有在途运行。先发取消信号。再等任务收尾。没自己结束的运行标记为interrupted。状态落库有预算限制。防止慢store把关停拖死。

（八）其他

- `cleanup()`：延迟后从内存移除运行记录。没有store时不移除。因为没有store就丢了历史。
- `wait_for_prior_finalizing()`：等更老的同线程运行做完事后清理。

## 三、它和谁协作

（一）RunStore

RunManager依赖RunStore做持久化。MemoryRunStore是默认实现。SQL存储是生产实现。

（二）RunRecord

RunManager的内存注册表保存RunRecord。RunRecord是每个运行的内存态。

（三）RunEventStore

RunManager在孤儿恢复时用RunEventStore补投递回执。

（四）worker层

worker.py的run_agent是RunManager的主要消费者。run_agent接收record和run_manager。Gateway服务层通过RunManager接纳运行。

（五）异常与枚举

RunManager抛出ConflictError、UnsupportedStrategyError、RunStartupError。cancel返回CancelOutcome。启动返回RunStartOutcome。

## 四、重要性评级

评级：10分。

理由：RunManager是整个runs模块的核心。所有运行的创建、取消、状态管理都经过这个类。多worker部署的租约、心跳、接管、幂等接纳全在这里。运行一致性的关键竞争处理也在这里。没有RunManager，运行管理就无从谈起。所以给10分。
