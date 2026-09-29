# MemoryRunStore档案

源码位置：backend/packages/harness/deerflow/runtime/runs/store/memory.py

## 一、这个类是干什么的

MemoryRunStore是运行存储的内存实现。

MemoryRunStore继承RunStore协议。

MemoryRunStore用Python字典保存运行记录。字典是`_runs`。键是run_id。值是运行字段字典。

MemoryRunStore用在数据库backend为memory的场景。这是默认场景。MemoryRunStore也用于测试。

MemoryRunStore等价于最早的RunManager._runs字典行为。把存储从RunManager拆出来后行为保持一致。

MemoryRunStore只支持单进程。多进程部署需要SQL存储。

## 二、类的成员

（一）内部字段

- `_runs`：运行记录字典。run_id到运行字段字典。
- `_change_seq`：变更序号计数器。每次变更递增。
- `_runs_by_thread`：二级索引。thread_id到run_id有序集合。镜像RunManager的索引。作用是按线程查询时避免全量扫描。

（二）索引与变更标记方法

- `_index_run()`和`_unindex_run()`：维护线程二级索引。索引和`_runs`同步变更。
- `_next_change_seq()`和`_mark_changed()`：分配变更序号。给变更的运行打上change_seq。

（三）基础读写方法

- `put()`：写入或更新运行记录。put是幂等快照写。重试早先快照时会保留已经存在的取消请求。
- `get()`：按run_id读取。带用户过滤。
- `list_changed()`：按change_seq游标列变更。升序稳定游标。
- `list_by_thread()`：按线程列运行。新的在前。用线程索引做O(线程内运行数)查询。
- `list_pending()`和`list_inflight()`：列pending和活跃运行。
- `delete()`：按run_id删除。
- `delete_by_thread()`：删除线程的历史运行。只删operation_kind为run的行。内部操作行保留。持久化的线程操作预约继续保护线程。

（四）状态更新方法

- `update_status()`：更新状态。只允许pending、running、interrupted行转换。terminal行返回False。
- `start_run()`：把pending行原子推进到running。
- `update_model_name()`：更新模型名。
- `update_run_completion()`：持久化完成字段。不能覆盖冲突的终态。error状态可以从interrupted转入。
- `update_run_progress()`：运行中的best-effort快照。只更新running行。

（五）重生成与token方法

- `list_successful_regenerate_sources()`：返回被成功重生成取代的源运行ID。
- `list_edit_regenerate_runs()`：返回编辑重跑尝试运行。最老的在前。
- `get_many_by_thread()`：批量加载选中运行。
- `aggregate_tokens_by_thread()`：聚合一线程的token用量。返回总量、按模型、按调用方的分解。旧数据没有按模型统计时回退到按model_name归因。

（六）多worker所有权方法

- `update_lease()`：续租。要求行还是活跃的且属主匹配。
- `renew_lease()`：续租并读取取消动作。委托update_lease。
- `request_cancel()`：持久化第一个取消动作。只支持interrupt和rollback。
- `finalize_if_not_cancelled()`：没有取消请求时才收尾。
- `claim_for_takeover()`：把租约过期的活跃行标记为error。
- `list_inflight_with_expired_lease()`：列租约过期的活跃行。naive时间戳按UTC处理。

（七）原子接纳方法

- `create_thread_operation_atomic()`：原子创建。支持幂等键检查。reject策略遇到活跃运行抛ConflictError。interrupt和rollback策略做两遍扫描。第一遍只检查不修改。第二遍统一标记interrupted。这样保证raise时不留下半改状态。和SQL事务语义对齐。

## 三、它和谁协作

（一）RunStore

MemoryRunStore继承RunStore协议。实现全部抽象方法。

（二）RunManager

RunManager把MemoryRunStore当持久化层用。默认配置就是内存存储。

（三）base.py的辅助函数

MemoryRunStore用`run_sort_key`和`run_is_before_cursor`做排序和分页。用LeaseRenewal、StatusFinalization做返回类型。

（四）manager.py的异常

MemoryRunStore的原子接纳会抛manager.py定义的ConflictError。幂等键冲突抛RunIdempotencyConflict。

## 四、重要性评级

评级：7分。

理由：MemoryRunStore是默认存储实现。开发和测试全靠它。它实现了协议的全部并发语义。原子接纳的两遍扫描、取消竞态保留、租约接管都做了正确实现。它没有持久化能力，生产环境用SQL存储。所以不到核心协议那么高。作为默认实现给7分。
