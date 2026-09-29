# deerflow.runtime.runs.store-档案

## 一、这个包是干什么的

这个包管理"运行记录"的存储。

一次运行就是一次完整的智能体执行。
例如用户发了一句提问。
例如一次定时任务触发。

系统需要把每次运行的元数据存起来。
这个包就是存储层的契约。

这个包的核心是`RunStore`抽象基类。
这个基类定义了运行记录存储的全部操作。
任何后端只要实现这套接口，就能接入运行时。

默认实现是`MemoryRunStore`。
默认实现把运行记录放在进程内存里。
内存实现用于开发和测试。
生产环境可以换成数据库实现。

## 二、包里的主要成员

### （一）模块base.py——契约层

#### 1、RunStore类

`RunStore`是抽象基类。
它定义了运行记录存储的标准操作。

主要方法分几组。

- 写入和读取。`put`写入一条运行记录。`get`按run_id读取一条。`delete`删除一条。
- 按线程查询。`list_by_thread`列出一个线程下的运行记录。`get_many_by_thread`批量读取。
- 状态流转。`update_status`更新运行状态。`start_run`把pending原子地转成running。`update_run_completion`写入最终完成字段。`update_run_progress`写入运行中的快照。`update_model_name`更新模型名。
- 列举活跃运行。`list_pending`列出待处理运行。`list_inflight`列出还在进行中的运行。
- 令牌统计。`aggregate_tokens_by_thread`按线程汇总令牌用量。
- 租约管理。`update_lease`续租。`renew_lease`续租并带回取消请求。`request_cancel`持久化第一个取消动作。`finalize_if_not_cancelled`在未被取消时才终结运行。`claim_for_takeover`把租约过期的运行原子标记为error。`list_inflight_with_expired_lease`列出租约已过期的运行。
- 原子准入。`create_thread_operation_atomic`原子地创建一个线程操作。它处理多进程唯一性。它处理multitask策略。它处理幂等键。
- 变更发现。`list_changed`按变更序号游标列出运行记录的公开变更。

每个方法都接受可选的`user_id`参数。
`user_id`用于用户隔离。
`user_id`为None表示单用户模式。
单用户模式不做用户过滤。

#### 2、数据类

`LeaseRenewal`是续租结果。
它带renewed字段。
它还带cancel_action字段。
cancel_action把取消请求带给持有租约的工作进程。
取消请求不转移租约所有权。

`StatusFinalization`是终结结果。
它表示"只在未取消时完成运行"这个操作的结果。

`EditReplayVisibility`描述编辑重放时的可见性。
它记录被隐藏的源运行和尝试运行。

#### 3、异常和工具函数

`RunIdempotencyConflict`表示幂等键冲突。
进程级幂等键已经属于另一条运行记录时抛出。

`normalize_run_created_at_iso`把运行时间戳修整成可解析的ISO格式。
查询字符串里的加号可能变成空格。
这个函数负责恢复偏移量。

`format_run_cursor_created_at`生成游标格式的时间戳。
`parse_run_created_at`把存储的时间戳解析成带时区的UTC时间。
`run_sort_key`给出"最新优先"列表的总排序。
排序先按created_at，再按run_id。
`run_is_before_cursor`判断一条记录是否比游标更旧。

这些工具函数支撑键集分页。
键集分页避免了偏移量分页的漂移问题。

### （二）模块memory.py——内存实现

#### 1、MemoryRunStore类

`MemoryRunStore`实现`RunStore`接口。
它把记录放在字典里。
它等效于早期RunManager内部的_runs字典。

它维护一个二级索引。
索引从thread_id映射到插入有序的run_id集合。
这个索引让按线程查询不必全量扫描。
`list_by_thread`走索引。
`aggregate_tokens_by_thread`也走索引。

它维护一个变更序号计数器。
每次写操作递增序号。
序号写入记录的change_seq字段。
`list_changed`用序号加run_id做游标。

#### 2、几个关键语义

`put`是幂等的快照写入。
重新写入同一条记录会保留已存在的取消请求。
这个设计防止重试覆盖一次竞态到达的取消。

`update_status`只允许翻转还活跃的行。
活跃状态是pending、running、interrupted。
interrupted被纳入是为了回滚路径。

`update_run_completion`不覆盖不同的终态。
错误终态可以从interrupted转入。

`request_cancel`只接受interrupt和rollback两种动作。
第一个到达的动作获胜。
后续调用不覆盖第一个动作。

`finalize_if_not_cancelled`检查取消标记。
有取消标记就拒绝终结。
没有取消标记才写终态。

`create_thread_operation_atomic`实现了完整的多任务语义。
reject策略遇到活跃运行就抛ConflictError。
interrupt和rollback策略会认领进行中的运行。
认领采用两遍扫描。
第一遍只做检查和抛错。
第二遍才做变更。
两遍扫描模拟了SQL事务的回滚语义。
如果中途抛错，存储不会被改动一半。

`claim_for_takeover`只在租约过期超过宽限期时接管。
条件更新避免了和持有者的心跳续租竞态。

## 三、它和谁协作

上游是`RunManager`。
`RunManager`依赖`RunStore`接口驱动运行生命周期。
`RunManager`位于runtime/runs/manager.py。

数据库实现在persistence层。
SQLAlchemy实现提供sqlite和postgres后端。
内存实现是database.backend=memory时的默认选择。

下游是Gateway服务。
运行历史API、取消API、令牌统计API都消费这个契约。
定时任务服务也通过它管理运行记录。

测试大量依赖`MemoryRunStore`。
离线测试用内存实现跑完整运行生命周期。

## 四、重要性评级

评级：10分。

理由如下。

这个包是运行元数据的核心契约。
`RunStore`是整个运行时最关键的接口之一。
约29个文件直接引用这个包。

它是核心路径。
每一次运行都要经过put、start_run、update_status、update_run_completion。
没有它，运行状态机就不存在。

它承载了最难的分布式语义。
租约、接管、取消竞态、幂等准入、键集分页都定义在这里。
这些语义的正确性直接决定多进程部署的可靠性。

删除它，运行时立即瘫痪。
Gateway无法启动运行。
无法查询历史。
无法取消运行。
所有依赖`RunStore`的数据库实现也失去契约来源。
