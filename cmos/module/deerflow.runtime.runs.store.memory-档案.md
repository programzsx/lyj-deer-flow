# deerflow.runtime.runs.store.memory-档案

## 一、这个模块是干什么的

这个文件是运行元数据存储的内存实现。

database.backend=memory时使用它。memory是默认后端。

测试也用它。

它等价于最早的RunManager._runs字典行为。

数据存在进程内存里。进程重启就没了。

## 二、模块里的主要成员

### 1、MemoryRunStore类

这个类继承RunStore。

#### （1）内部结构

_runs是run_id到run字典的映射。这是主存储。

_runs_by_thread是二级索引。线程id到插入顺序的run_id集合。用字典当有序集合。和_runs同步维护。按线程的查询避免全量扫描。

_change_seq是变更序号。每次变更递增。

#### （2）变更标记

_mark_changed给每个变更的run打上一个变更序号。

变更序号是change_seq游标分页的依据。

#### （3）读取方法

get按id读。user_id不匹配返回None。

list_by_thread用线程索引做O(线程内run数)的查询。最新优先排序。支持键集游标。

list_changed按变更序号游标列出公开的run变更。稳定升序。只列operation_kind是run的行。

list_successful_regenerate_sources扫线程索引。收集状态是success且metadata带regenerate_from_run_id的run。

list_edit_regenerate_runs收集replay_kind是edit的尝试。按created_at排序。

get_many_by_thread批量加载。

list_pending和list_inflight按状态过滤。

aggregate_tokens_by_thread聚合token。优先用token_usage_by_model。旧数据没有按模型统计时回退到model_name整体归属。保留legacy行为。按模型统计落地之前写入的行不被静默丢弃。

#### （4）状态方法

update_status只从pending、running、interrupted流转。其他状态返回False。

start_run只有pending行才能转running。

update_run_completion限制允许的源状态。error可以从interrupted来。其他终态冲突返回False。

update_run_progress只有running行接受进度更新。

update_model_name更新模型名并标记变更。

delete删单行并反索引。

delete_by_thread删线程的历史run。只删operation_kind是run的行。内部操作行保留。内部操作继续保护线程直到自己的释放路径。

#### （5）租约方法

update_lease只续pending或running行。owner_worker_id不匹配返回False。

renew_lease通过update_lease续约。轻量子类和测试重写legacy原语时保持同样行为。续约成功返回行上的cancel_action。

request_cancel持久化第一个取消动作。用cancel_requested_at记录时间。

finalize_if_not_cancelled检查cancel_action。取消已记录就返回取消动作。否则终化。

claim_for_takeover用is_lease_expired判断租约。过期才标记error。

list_inflight_with_expired_lease扫描全部run。租约为NULL的行算孤儿。租约解析失败的行也算孤儿。naive时间戳当UTC处理。SQLite读取会丢tzinfo。aware比较不会抛TypeError。

#### （6）原子准入

create_thread_operation_atomic是核心方法。

它支持幂等键。发现重复键抛RunIdempotencyConflict。

reject策略下发现活跃run抛ConflictError。

interrupt和rollback策略做两遍扫描。第一遍只收集候选并检查。发现别的worker拥有的活跃run时抛ConflictError。发现活跃的检查点写时抛ConflictError。抛出前不做任何变更。

两遍的原因是镜像SQL store的事务语义。SQL里抛出会回滚整个事务。内存路径内联变更会在抛出时留下半中断状态。

第一遍通过后分配一个变更序号。这个原子变更集只占一个位置。SQL store的单例时钟给同一组变更分配同样的单个值。每行单独标记会把一次中断加替换拆成两个位置。游标消费者按change_seq和run_id分页。拆成两个位置会错。

然后一次性把所有候选标记成interrupted。最后插入新行。

## 三、它和谁协作

它继承runtime.runtime.runs.store.base里的RunStore。

它被RunManager调用。

它是默认的元数据存储后端。开发环境和测试用它。

它在内部引入manager的ConflictError。这是唯一的反向依赖。

## 四、重要性评级

评级是6分。

理由是这个文件是默认的run存储后端。

它的两遍扫描镜像了SQL store的事务语义。这是多worker正确性在内存路径上的对应。

变更序号的原子分配保护了change_seq游标的稳定性。

不评高分是因为它不能用于多进程生产部署。真实部署用SQL实现。
