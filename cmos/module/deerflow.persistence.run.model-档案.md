# deerflow.persistence.run.model-档案

## 一、这个模块是干什么的

这个模块定义运行元数据的ORM模型。

模型类是RunRow和RunChangeClockRow。

RunRow对应数据库里的runs表。

RunChangeClockRow对应run_change_clock表。

run是Agent的一次执行。

每次用户发消息触发一次run。

run的状态、token用量、错误信息都存在runs表里。

## 二、模块里的主要成员

### 1、RunRow类

RunRow继承自Base。

RunRow对应runs表。

#### （1）标识字段

run_id是主键。

thread_id是所属线程。

thread_id有索引。

assistant_id是使用的agent。

user_id是拥有者。

user_id有索引。

#### （2）状态字段

status是运行状态。

status有六种值。

六种是pending、running、success、error、timeout、interrupted。

operation_kind是操作种类。

默认run。

这个表也存持久的线程操作预约。

预约包括checkpoint写入、工件写入、分支、线程删除。

idempotency_key是幂等键。

幂等键支持恢复场景。

#### （3）模型字段

model_name是模型名。

multitask_strategy是多任务策略。

默认reject。

metadata_json是JSON元数据。

kwargs_json是JSON调用参数。

error是错误信息。

stop_reason是停止原因。

#### （4）便利字段

message_count是消息数。

first_human_message是第一条用户消息。

last_ai_message是最后一条AI消息。

这三个字段让列表页不用查询RunEventStore。

#### （5）token字段

total_input_tokens是输入token总数。

total_output_tokens是输出token总数。

total_tokens是token总数。

llm_call_count是LLM调用次数。

lead_agent_tokens是主agent的token。

subagent_tokens是subagent的token。

middleware_tokens是中间件的token。

token_usage_by_model是按模型分组的用量。

JSON类型。

这些用量由RunJournal在内存里累计。

run完成时写入。

#### （6）follow_up字段

follow_up_to_run_id是跟进运行的原运行。

#### （7）多worker字段

owner_worker_id是持有这个run的worker。

lease_expires_at是租约过期时间。

cancel_action是取消动作。

cancel_requested_at是取消请求时间。

非持有worker把取消记在这里。

持有worker在续租时消费。

第一个动作赢。

#### （8）时间字段和change_seq

created_at和updated_at是创建和更新时间。

change_seq是变更序号。

change_seq是全局递增的变更位置。

变更序号支撑已变更运行的游标分页。

#### （9）约束和索引

有索引ix_runs_thread_status、ix_runs_lease、ix_runs_change_seq、ix_runs_user_change_seq。

有唯一索引uq_runs_idempotency_key。

幂等键唯一。

有部分唯一索引uq_runs_thread_active。

条件是status IN (pending, running)。

一个线程最多有一个活跃run。

这是跨进程原子性保证。

索引必须放在ORM的__table_args__里。

原因是空库引导路径跑create_all加stamp head。

那条路径不执行定义这个索引的迁移。

### 2、RunChangeClockRow类

这个类对应run_change_clock表。

这是单例计数器。

计数器分配后端拥有的变更位置。

change_seq就由它分配。

## 三、它和谁协作

### 1、它依赖谁

它依赖deerflow.persistence.base的Base。

### 2、谁依赖它

run/sql.py的RunRepository用这两个模型读写。

migrations/versions/0001_baseline.py创建runs表的baseline部分。

0004_run_ownership.py加多worker字段。

0005加stop_reason。

0023_run_change_seq.py加change_seq。

bootstrap.py的canonical-0019 floor列出runs表的列。

## 四、重要性评级

评级是9分。

理由如下。

runs表是整个系统的核心表。

每次Agent执行都写一张run行。

部分唯一索引uq_runs_thread_active是跨进程的关键保证。

多worker的租约和取消协议在这里。

change_seq支撑变更游标分页。

token用量的分组统计也在这里。

扣分的原因是它是纯模型文件。

并发协议的实现在sql.py里。
