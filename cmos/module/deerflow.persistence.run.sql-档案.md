# deerflow.persistence.run.sql-档案

## 一、这个模块是干什么的

这个模块是SQLAlchemy后端的RunStore实现。

仓库类叫RunRepository。

RunRepository实现runtime/runs/store/base定义的RunStore接口。

这个模块读写runs表。

每个方法获取并释放自己的短生命周期会话。

运行状态更新来自后台worker。

worker可能活几分钟。

连接不在长时间执行期间被持有。

这个模块是持久化层里并发设计最复杂的文件之一。

## 二、模块里的主要成员

### 1、RunRepository类

这个类持有会话工厂。

这个类实现全部RunStore接口方法。

#### （1）put方法

put插入或更新run行。

RunManager在SQLite瞬时失败后重试put。

幂等防止成功但未被确认的提交变成主键冲突。

每次写入分配change_seq。

#### （2）get方法和list_by_thread方法

get按run_id取一条。

list_by_thread列一个线程的运行。

分页用keyset游标。

游标是(created_at, run_id)对。

过滤只在operation_kind为run的行。

#### （3）list_changed方法

list_changed返回变更序号之后变化过的运行。

游标是(change_seq, run_id)对。

这是增量同步的基础。

#### （4）update_status方法

update_status更新状态。

只有仍然是活跃状态的行能被更新。

活跃状态是pending、running、interrupted。

interrupted包含在内。

原因是回滚路径先running变interrupted。

再interrupted变error。

error和success保持锁定。

对等接管或已完成的运行不能被迟到的写入者覆盖。

#### （5）start_run方法

start_run只启动仍然pending的run。

被取消的run不能复活。

#### （6）update_run_completion方法

run完成时更新状态、token用量、便利字段。

message截断到2000字符。

允许的来源状态包括pending、running和目标状态本身。

error还允许interrupted。

#### （7）update_run_progress方法

run进行中更新token用量和便利字段。

只更新provided的字段。

只作用于running状态的行。

#### （8）aggregate_tokens_by_thread方法

这个方法聚合一个线程的token用量。

by_model在Python侧归并。

归并自每行的token_usage_by_model JSON列。

subagent和middleware的token落到真正产出它们的模型上。

这是issue #3645的修复。

旧列不存在时回退到model_name加total_tokens。

保留legacy的主agent行为。

#### （9）update_lease方法和renew_lease方法

update_lease更新租约。

renew_lease原子地续租并读取消意图。

renew_lease用RETURNING返回cancel_action。

持有worker在续租时消费取消请求。

#### （10）request_cancel方法

request_cancel原子地持久化第一个取消动作。

action只接受interrupt和rollback。

CASE表达式只有cancel_action为NULL时才写入。

后来的取消动作不改先到的。

#### （11）finalize_if_not_cancelled方法

原子地让完成只在取消之前赢。

行活跃且没有取消动作时完成。

已有取消动作时返回那个动作。

#### （12）claim_for_takeover方法

对等接管过期租约的运行。

租约过期超过grace秒才能接管。

接管把运行标成error。

#### （13）create_thread_operation_atomic方法

这个方法原子地创建带跨进程线程唯一性的运行。

reject策略时直接INSERT。

部分唯一索引强制单活跃run。

冲突抛IntegrityError。

interrupt和rollback策略时先SELECT FOR UPDATE锁定线程的活跃行。

租约仍有效且属于别的worker时抛ConflictError。

活跃的checkpoint写入预约也抛ConflictError。

活跃行被标成interrupted。

然后INSERT新行。

全部在一个事务里。

幂等键冲突时抛RunIdempotencyConflict。

#### （14）list_pending和list_inflight方法

list_pending列pending的运行。

list_inflight列活跃运行给启动恢复用。

### 2、辅助函数

_next_change_seq分配变更序号。

用单例clock表的UPDATE RETURNING。

dialect决定用哪个方言的insert。

_lease_expired_or_null生成租约过滤。

_lease_expired_or_null对NULL和过期都返回True。

_safe_json确保对象可JSON序列化。

不可序列化时回退到model_dump或str。

_row_to_dict把行转成接口字典。

时间用coerce_iso规范化。

## 三、它和谁协作

### 1、它依赖谁

它依赖run/model.py的两个模型。

它依赖runtime/runs/store/base的接口和异常。

它依赖runtime/user_context的AUTO和resolve_user_id。

它依赖deerflow.utils.time的coerce_iso。

### 2、谁依赖它

RunManager用它管理运行生命周期。

scheduled_tasks/sql.py和scheduled_task_runs/sql.py用RunRepository查底层run。

启动恢复流程用list_inflight。

## 四、重要性评级

评级是10分。

理由如下。

运行生命周期是整个系统的核心链路。

全部Agent执行的状态管理在这里。

跨进程的线程唯一性靠create_thread_operation_atomic。

多worker的租约、取消、接管协议全部在这里。

change_seq的分配和游标分页在这里。

token聚合的模型归并修复在这里。

这是持久化层最核心的仓库。
