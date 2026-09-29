# deerflow.runtime.runs.manager

## 一、这个模块是干什么的

这个模块管理"运行"的生命周期。

一次运行就是一次代理执行。

一次运行有完整的状态流转。

状态流转是pending、running、success、error、timeout、interrupted。

这个模块的核心类是RunManager。

RunManager在内存里登记每一次运行。

RunManager还能把运行记录持久化到RunStore。

有了RunStore，运行历史就能在进程重启后保留。

这个模块还解决一个难题。

难题是多进程部署下的运行归属。

多个Gateway实例可以共享一个数据库。

每个实例只认识自己启动的运行。

这个模块用租约机制解决归属问题。

每个运行记录归属它的worker。

worker通过心跳不断续租。

租约过期就意味着这个worker可能死了。

其他worker就能安全接管这些孤儿运行。

## 二、模块里的主要成员

- RunManager：核心管理器。负责创建、登记、查询、取消运行。
- RunRecord：单条运行记录。包含run_id、thread_id、状态、租约信息、幂等键等字段。
- _admit_thread_operation：线程级准入。原子地检查同线程有没有进行中的运行。reject策略直接抛ConflictError。interrupt和rollback策略会先取消进行中的运行。
- create：创建一个run记录。内部走准入流程。
- try_start：把pending状态的运行推进到running。这是启动屏障。构建代理之前必须先过这一关。
- cancel：请求取消运行。本机拥有的运行直接本地取消。非本机的运行分两种情况。租约过期的运行会被本机接管并标记error。租约还有效的运行会持久化取消意图，owner在下次心跳时执行。
- _admit_thread_operation还支持幂等键。相同的幂等键会复用已存在的运行，不会重复创建。
- _record_from_store：从存储行还原记录。跨worker的幂等复用返回store_only句柄。这种句柄不会注册进内存，因为peer不会为它收尾。
- reconcile_orphaned_inflight_runs：孤儿恢复。把租约过期的active运行标记为失败。
- start_heartbeat、stop_heartbeat、_heartbeat_loop：心跳机制。周期性续租，并处理持久化的取消请求。
- set_status、set_status_if_not_cancelled、persist_current_status：状态流转与持久化。
- wait_for_prior_finalizing、has_later_run：处理运行之间的先后关系。
- PersistenceRetryPolicy：持久化重试策略。SQLite锁冲突会被识别并重试。
- _is_unique_violation：识别唯一约束冲突。优先用驱动原生的错误码，不依赖错误消息文本。
- CancelOutcome、ConflictError、RunStartOutcome：结果与错误类型。

## 三、它和谁协作

- 它依赖runtime/runs/store/下的RunStore做持久化。
- 它依赖runtime/user_context解析运行归属的用户。
- 它依赖utils/time处理租约过期判断。
- 它被runtime/runs/worker.py的run_agent调用。worker用它推进状态、登记收尾。
- 它被app/gateway/services.py等Gateway入口调用。Gateway用准入接口启动运行。
- 它的取消接口被Gateway的运行路由暴露给外部。

## 四、重要性评级

评级是10分。

理由是这是整个运行子系统的中枢。

每一次代理执行都要经过它的准入、启动、状态流转和取消。

多实例部署的正确性完全依赖它的租约与幂等语义。

它的逻辑一旦出错，会导致运行丢失、重复执行或状态错乱。
