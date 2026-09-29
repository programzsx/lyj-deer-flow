# deerflow.runtime.runs-档案

## 一、这个包是干什么的

这个包是DeerFlow的"运行生命周期管理"包。

包名是`deerflow.runtime.runs`。源码在`backend/packages/harness/deerflow/runtime/runs/`。

大白话讲。一个"运行"（run）是智能体的一次执行。用户发一条消息。智能体跑起来。流式输出。最终结束。这个过程的管理全部在这个包里。

这个包做四件事。

- 管理运行的内存注册表。带可选的持久存储。这是`RunManager`。
- 真正执行智能体并把事件发布到流桥。这是`run_agent()`。
- 定义运行状态、断连模式、线程操作类型这些枚举。
- 提供运行记录的存储接口和内存实现。

它模仿LangGraph Platform API的生命周期语义。多任务策略、断连行为、运行状态。都和LangGraph Platform对齐。

这个包是runtime里最大的子包。`manager.py`约11万字节。`worker.py`约15万字节。两个加起来超过26万字节。它是整个运行链路的心脏。

## 二、包里的主要成员

### 1、__init__.py

它从`manager`、`schemas`、`worker`重新导出全部公开符号。`RunManager`、`RunRecord`、`RunStatus`、`RunContext`、`run_agent`、`ConflictError`、`CancelOutcome`、`DisconnectMode`、`ThreadOperationKind`、`UnsupportedStrategyError`、孤儿恢复常量等。

### 2、schemas.py（枚举）

三个StrEnum。

- `ThreadOperationKind`。持有线程排他准入的操作类型。`run`、`checkpoint_write`、`artifact_write`、`artifact_archive`、`branch`、`delete`。
- `RunStatus`。单个运行的生命周期状态。`pending`、`running`、`success`、`error`、`timeout`、`interrupted`。
- `DisconnectMode`。SSE消费者断连时的行为。`cancel`取消。`continue`继续跑。

### 3、naming.py（运行命名）

`resolve_root_run_name()`。给LangChain/LangSmith追踪解析根运行名。优先从config的`context`或`configurable`里取`agent_name`。取不到用`assistant_id`。再取不到用`lead_agent`。

### 4、manager.py（运行注册表）

`RunManager`类。内存运行注册表。带可选的持久`RunStore`。文件约11万字节。

核心数据。`_runs`是run_id到`RunRecord`的字典。`_runs_by_thread`是线程索引。按插入顺序。两个结构在锁内同步变更。线程查询不用全扫描。

`RunRecord`是单个运行的可变记录。字段包括。run_id、thread_id、状态、断连模式、操作类型、多任务策略、元数据、kwargs、user_id、owner_worker_id、lease_expires_at、token统计（总量加按调用方和按模型的分桶）、消息摘要、idempotency_key等。`_runs`只持有本worker准入的记录。跨worker的幂等复用返回`store_only`行。不注册。注册的副本会保持pending/running状态。409后续同线程准入。隐藏属主的孤儿。把peer的cancel引到本地属主路径。

主要能力分组如下。

- 创建与准入。`create()`创建pending运行并注册。生产调用方应该用`create_or_reject()`或`_admit_thread_operation()`。`_admit_thread_operation()`原子地检查进行中的运行并创建新的。锁顺序不变式。本地锁横跨本地检查、存储插入、本地注册。所以存储插入永远不会在本worker的ConflictError即将触发时成功（那会在存储里漏一个pending行）。跨进程竞争在存储层解决。用部分唯一索引`(thread_id) WHERE status IN ('pending','running')`。reject策略下线程已有pending/running运行时抛`ConflictError`。interrupt/rollback策略先取消进行中的运行。有活跃checkpoint_write时拒绝。幂等键冲突时返回store_only句柄。不注册。idempotency键解析到不同线程或用户时抛`RuntimeError`。
- 启动屏障。`try_start()`把pending转成running。`fail_start_if_pending()`。`RunStartOutcome`描述结果。
- 状态管理。`set_status()`、`set_status_if_not_cancelled()`、`persist_current_status()`。`_persist_status()`把状态转换持久化到存储。它是尽力而为的。存储行已经终态时区分三种情况。peer接管（error）。本地取消或完成竞争（interrupted/success）。行从未持久化（重建）。`ownership_lost`为真时跳过持久化。防止迟到的终态写覆盖接管。
- 完成。`update_run_completion()`写入token统计和消息摘要。`update_run_progress()`、`update_finalizing_progress()`写进度。
- 查询。`get()`、`aget()`先查内存。查不到落存储。存储await后重查内存。`list_by_thread()`最新优先。keyset游标分页。`get_many_by_thread()`、`list_successful_regenerate_sources()`、`list_edit_replay_visibility()`。
- 取消。`cancel()`是核心。分三条路径。本地路径。本worker在内存里持有这个运行。设置abort事件。取消任务。状态转interrupted。持久化。持久化失败且存储行已是error时返回`taken_over`。持久取消路径。多worker部署带心跳时。先持久记录取消动作。属主在下次心跳观察到并执行本地中止。非本地路径。没有内存记录时查存储。租约还有效时持久记录远程取消。租约过期加宽限期时原子接管（`claim_for_takeover`）。标记为error。假定属主已死。`CancelOutcome`枚举描述结果。
- 租约与心跳。`start_heartbeat()`和`stop_heartbeat()`。`_heartbeat_loop()`定期续租。`_renew_leases()`。租约过期意味着属主不可达。
- 孤儿恢复。`reconcile_orphaned_inflight_runs()`。Gateway重启后处理未达终态的运行。`ORPHAN_RECOVERY_STOP_REASON`和`STARTUP_ORPHAN_RECOVERY_ERROR`是共享常量。周期性孤儿调和在`_reconcile_orphans_periodic()`。
- 排空与清理。`cleanup()`延迟删除。`shutdown()`等待全部进行中运行结束。
- SQLite瞬时错误重试。`_is_retryable_persistence_error()`识别锁竞争。`PersistenceRetryPolicy`定义有界重试。最多5次。指数退避。
- 唯一约束识别。`_is_unique_violation()`优先用驱动原生信号。psycopg的pgcode是23505。sqlite3的错误码。消息文本匹配只是兜底。而且用IntegrityError类型门禁。避免无关异常被误分类。静默变成HTTP 409而不是500。

### 5、worker.py（智能体执行器）

`run_agent()`是核心函数。文件约15万字节。它在后台执行智能体。把事件发布到流桥。`make dev`、Docker、生产模式都走这个函数。

`RunContext`是基础设施依赖容器。把checkpointer、store、event_store、thread_store、mcp_task_repo、app_config、extensions、检查点模式和快照频率打包成一个对象。`run_agent`收一个对象。不是一串不断变长的关键字参数。

`run_agent()`的主要流程。

- 预检。journal构造提前到预检之前。让每个终态运行都能发回执。
- 构建运行时上下文。`_build_runtime_context()`。拒绝调用方伪造的`__conversation_reader`。安装host提供的值。服务器拥有的键从运行时上下文赋值。没有时移除。嵌入式调用方不能在`config['context']`里保留伪造的生命周期身份。
- 绑定trace id。`_bind_trace_id()`给运行时上下文和config的metadata打上trace id。
- 构建agent图。调用agent_factory。解包lead assembly。拿生效模型名。
- 捕获回滚点。`_capture_rollback_point()`在运行开始前通过accessor物化完整的运行前状态。捕获原始pending_writes到不可变的`RollbackPoint`。捕获失败禁用回滚。fail-closed。绝不恢复部分状态。
- 流式循环。`_stream_once()`消费图的流。逐项发布到流桥。`_LargeFileToolChunkBatcher`把`write_file`和`str_replace`的参数增量按有界批次发布。多模式的`messages-tuple`消费者受益。单模式消费者保持原始契约。`_compose_sse_event()`处理子图命名空间。带`stream_subgraphs`时子图帧在SSE事件名里保留命名空间（`values|<ns>`）。不冒充根帧。
- seq打点。`_MessageSeqStamper`给values帧附加线程全局的feed seq。带`feed_generation`回调。reader缓存的查无答案在feed变化后值得重问。
- 子代理事件缓冲。`_SubagentEventBuffer`缓冲子代理的`task_*`步骤事件。凑25条或终态时一次`put_batch`落盘。深子代理（general-purpose最多150轮）会在热流循环上发几百个步骤事件。逐个用`put()`会在Postgres上串行化。尊重存储契约。
- 终态。成功、错误、超时、取消、中断各有路径。取消时的回滚。full模式从运行前检查点分叉。delta模式线性替换当前头。`_linearize_delta_checkpoint_resume()`处理delta模式的线性化恢复。运行历史元数据。`persist_run_history_metadata()`写技能使用快照和时长。终态投递回执。`_persist_delivery_receipt()`用事件存储的幂等单例写。
- 目标循环。`_clear_completed_goal()`、`_prepare_goal_continuation_input()`、`_persist_goal_evaluation()`。运行结束后评估目标。未达成时构造隐藏续跑输入。再跑一轮。
- 清理。`_release_run_scoped_references()`释放运行范围引用。`close_agent_stream()`（来自`stream_cleanup.py`）保证流关闭完成。

其他重要成员。

- `close_agent_stream()`。在传播调用方取消之前关闭智能体流。流清理拥有provider、graph、tool的清理。这些必须在调用方释放运行范围资源之前完成。所以host取消被推迟到关闭任务排空。关闭自身的取消对调用方可见。
- `_checkpoint_thread_lock()`。检查点线程锁。串行化回滚捕获和线性重写。
- `_persist_delivery_receipt()`。终态投递回执。工件证据和终态状态必须在满意的目标被清除前落定。

### 6、store/（运行记录存储）

子包。定义`RunStore`抽象接口和内存实现。

- `base.py`。`RunStore`抽象类。方法包括`put`、`get`、`list_by_thread`、`list_changed`、`update_status`、`start_run`、`update_run_completion`、`update_run_progress`、`update_lease`、`renew_lease`、`request_cancel`、`finalize_if_not_cancelled`、`claim_for_takeover`、`create_thread_operation_atomic`、`create_run_atomic`等。还有keyset游标辅助。`normalize_run_created_at_iso()`处理查询字符串把加号解码成空格的情况。`run_sort_key()`定义最新优先的全序。数据类包括`LeaseRenewal`（续租结果，带持久取消动作）、`StatusFinalization`（取消没赢时的终态完成）、`EditReplayVisibility`（编辑重放的可见性）。
- `memory.py`。`MemoryRunStore`。内存字典实现。带change_seq。`_mark_changed()`记录变更供`list_changed()`游标消费。全部抽象方法的内存版。
- SQL实现不在子包里。在`deerflow/persistence/run/sql.py`。那里实现`RunStore`接口。

## 三、它和谁协作

### 1、上游

- `deerflow.runtime`。父包门面。重新导出本包符号。
- `deerflow.runtime.events.store`。事件存储。worker写事件、投递回执、子代理事件缓冲。
- `deerflow.runtime.user_context`。AUTO哨兵和`resolve_user_id`。运行记录的属主解析。
- `deerflow.runtime.checkpoint_state`。accessor和回滚。
- `deerflow.runtime.serialization`。流项序列化。
- `deerflow.utils`。时间、trace id。
- `deerflow.agents.goal_state`。目标状态类型。
- `deerflow.config.run_ownership_config`。租约配置。
- `deerflow.persistence.run.sql`。SQL实现`RunStore`接口。
- `deerflow_extension_api`。扩展任务通知。

### 2、下游（被谁用）

全仓库搜索`from deerflow.runtime.runs`的导入引用有183处（不含runtime自身）。引用文件包括。

- `backend/app/gateway/services.py`。Gateway的运行服务。start_run走`RunManager`加`run_agent`。
- `backend/app/gateway/routers/thread_runs.py`和`runs.py`。运行API路由。
- `backend/app/gateway/deps.py`。装配。
- `backend/app/gateway/checkpoint_retention.py`、`conversation_access.py`、`conversation_reader.py`。检查点保留、会话访问。
- `backend/app/mcp_tasks/service.py`。MCP任务服务。
- `backend/packages/harness/deerflow/subagents/executor.py`。子代理执行器。
- `backend/packages/harness/deerflow/client.py`。嵌入式客户端。
- `backend/packages/harness/deerflow/persistence/run/sql.py`和`scheduled_task_runs/sql.py`。持久层。
- 多个测试文件。`test_multi_worker_run_ownership.py`、`test_gateway_services.py`、`test_run_worker_rollback.py`等。

### 3、依赖方向

这个包属于harness层。不导入app层。Gateway调用它。它不调用Gateway。目标评估器和压缩等能力放在runtime的其他模块里。worker通过懒导入引用agents和subagents。避免包初始化的死循环。

## 四、重要性评级

评级是10分。

理由如下。

这个包是DeerFlow智能体运行的心脏。每个用户消息触发的运行。每次取消。每次回滚。每次恢复。每个终态。全部经过`RunManager`和`run_agent()`。

它被引用的地方非常多。全仓库导入引用有183处（不含runtime自身）。Gateway服务、运行路由、MCP任务、子代理执行器、嵌入式客户端、持久层都在用。引用文件数超过15个核心文件。

它是核心路径中的核心。Gateway的`/api/langgraph/*`和`/api/runs`的每个请求都落到这里。调度任务、IM渠道、MCP任务通知也走同样的运行路径。

删除它会怎样。DeerFlow没有任何运行能力。Gateway的start_run直接失败。整个产品退化为静态REST壳。

它的代码量巨大。`manager.py`约11万字节。`worker.py`约15万字节。加上store子包和枚举命名辅助。它是整个harness里最重的子包。

为什么是满分。三个条件全部满足。被海量引用。每次请求的核心路径。删除等于产品核心能力消失。多worker所有权、租约、幂等准入、delta线性化这些复杂度都在这里。没有任何其他地方能替代它们。

为什么不是9分。没有理由。这个包的删除影响和`deerflow.runtime`门面包同级。而门面包的公开符号大部分就是从这里导出的。
