# deerflow.persistence.run-档案

源码路径：backend/packages/harness/deerflow/persistence/run/__init__.py

## 一、这个包是干什么的

这个包负责run元数据的持久化。

run是Agent的一次执行。

用户每发一条消息就产生一个run。

这个包存每次执行的元数据。

这些元数据包括状态、token用量、错误、消息摘要。

这个包对应数据库里的runs表。

还有一个run_change_clock表。

## 二、包里的主要成员

（1）model.py的RunRow

RunRow对应runs表。

一行代表一次run。

字段如下。

run_id是主键。

thread_id是哪个会话。

thread_id有索引。

assistant_id是哪个agent。

user_id是属主。

user_id有索引。

status是状态。

状态有pending、running、success、error、timeout、interrupted。

operation_kind是操作种类。

默认是run。

同一张表还存线程操作预留。

预留包括checkpoint写入、artifact写入、分支、thread删除。

idempotency_key是幂等键。

幂等键上有唯一索引。

model_name是用的模型。

multitask_strategy是多任务策略。

默认reject。

metadata_json和kwargs_json是元数据和参数。

error是错误文本。

stop_reason是停止原因。

便利字段如下。

message_count是消息数。

first_human_message是第一条人话。

last_ai_message是最后一条AI话。

这些字段让列表页不用查RunEventStore。

token用量字段如下。

total_input_tokens、total_output_tokens、total_tokens。

llm_call_count是LLM调用次数。

lead_agent_tokens、subagent_tokens、middleware_tokens按调用方分类。

token_usage_by_model是按模型的JSON。

这些由RunJournal在内存累计。

run完成时写入。

follow_up_to_run_id是追问关联。

多worker归属字段如下。

owner_worker_id是持有者。

lease_expires_at是租约到期时间。

cancel_action和cancel_requested_at记录取消意图。

非持有worker在这里记录取消。

持有者在续租时消费。

第一个动作赢。

created_at和updated_at是时间戳。

change_seq是变更序号。

索引如下。

(thread_id, status)有组合索引。

lease_expires_at有索引。

idempotency_key有唯一索引。

change_seq有两个组合索引。

还有uq_runs_thread_active部分唯一索引。

一个thread最多一个pending或running的run。

跨进程原子性靠这个索引。

索引必须放在ORM的__table_args__里。

因为空库bootstrap走create_all加stamp head。

那条路径不会执行migration。

RunChangeClockRow对应run_change_clock表。

这是单例行。

这张表分配后端拥有的变更位置。

（2）sql.py的RunRepository

RunRepository继承RunStore抽象。

每个方法获取并释放自己的短命session。

run状态更新来自后台worker。

worker可能活几分钟。

所以不跨长执行持有连接。

方法如下。

put插入或更新run行。

put是幂等的。

RunManager在SQLite瞬时失败后会重试put。

幂等防止已提交但未确认的提交变成主键冲突。

get按run_id查一个。

带owner过滤。

list_changed按change_seq增量列出变更的run。

list_by_thread列出一个thread的run。

分页用keyset方式。

游标是(created_at, run_id)。

list_successful_regenerate_sources列出成功的重生成源。

list_edit_regenerate_runs列出编辑型重生成run。

get_many_by_thread批量查。

update_status更新状态。

只允许pending、running、interrupted的行变更。

success和error被锁住。

同伴的接管或已完成的run不会被迟到写者覆盖。

start_run只启动还是pending的run。

已取消的行不能复活。

update_model_name更新模型名。

delete删一个run。

delete_by_thread删一个thread的历史run。

只删operation_kind为run的行。

线程操作预留不能删。

预留有自己的释放路径。

批量删除故意不推run-change时钟。

list_pending列pending的run。

list_inflight列出活跃run。

启动恢复用。

update_run_completion完成时更新状态加token用量加便利字段。

返回False表示行缺失或已有冲突的终态。

update_run_progress在run活跃时更新进度。

aggregate_tokens_by_thread汇总thread的token用量。

by_model在Python端归并。

subagent和middleware的token落在实际产出的模型上。

多worker归属方法如下。

update_lease更新租约。

renew_lease原子地续租并读取消意图。

request_cancel原子地记录第一个取消动作。

取消动作只有interrupt和rollback。

finalize_if_not_cancelled只在未取消时让完成赢。

claim_for_takeover认领租约过期的run。

认领把run标记为error。

list_inflight_with_expired_lease列出租约过期的活跃run。

create_thread_operation_atomic原子地创建run。

reject策略靠部分唯一索引强制单活跃run。

interrupt和rollback策略先SELECT FOR UPDATE锁inflight行。

取消它们再插入新行。

全部在一个事务里。

活的他人run抛ConflictError。

活跃的checkpoint写也抛ConflictError。

IntegrityError且带幂等键时抛RunIdempotencyConflict。

## 三、它和谁协作

Gateway的deps.py构造RunRepository。

RunManager用put、update_status、start_run等方法。

RunJournal写token用量。

启动恢复用list_inflight。

调度器用claim_for_takeover做多实例恢复。

scheduled_tasks和scheduled_task_runs包引用RunRow做关联。

这个仓库依赖engine.py的session工厂。

owner过滤依赖deerflow.runtime.user_context。

## 四、重要性评级

评级：10分。

理由：

run是整个系统的核心业务记录。

每次对话都产生run。

run状态机靠这张表驱动。

token计费靠这张表。

多实例恢复靠租约字段。

thread活跃唯一约束是跨进程原子性的保证。

丢这张表等于丢全部执行历史。

所以这个包是最高分。
