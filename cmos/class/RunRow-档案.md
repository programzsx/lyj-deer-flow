# RunRow-档案

## 一、这个类是干什么的

RunRow是persistence/run/model.py里的ORM模型。

这个类是运行元数据的持久化行。

runs表。

每次代理运行一行。

这个行承载运行的全部元数据。

包括状态、模型、token用量、运行所有权、follow-up关联。

这个类位于backend/packages/harness/deerflow/persistence/run/model.py。

## 二、类的成员（字段，各自做什么）

### 1、标识与状态字段

- run_id是主键。
- thread_id是会话id。不可空。有索引。
- assistant_id是代理标识。可为None。
- user_id是用户id。可为None。有索引。
- status是状态。取值是pending、running、success、error、timeout、interrupted。默认pending。
- operation_kind是操作种类。默认"run"。
- idempotency_key是幂等键。可为None。

### 2、模型与配置字段

- model_name是模型名。
- multitask_strategy是并发策略。默认"reject"。
- metadata_json和kwargs_json是JSON列。
- error是错误文本。kwargs_json存储时会脱敏。
- stop_reason是停止原因。

### 3、列表便捷字段

为列表页设计。不查RunEventStore。

- message_count是消息数。
- first_human_message是第一条人消息。
- last_ai_message是最后一条AI消息。

### 4、token用量字段

token用量由RunJournal在内存里累计，运行完成时写入。

- total_input_tokens、total_output_tokens、total_tokens。
- llm_call_count。
- lead_agent_tokens、subagent_tokens、middleware_tokens分别归因。
- token_usage_by_model按模型分解。

### 5、多worker运行所有权字段

- owner_worker_id是拥有者worker。
- lease_expires_at是租约过期时间。
- cancel_action是非拥有worker记录的取消。拥有者在续租时消费。第一个动作获胜。
- cancel_requested_at是取消请求时间。

### 6、表级索引

- ix_runs_thread_status是thread加status的索引。
- ix_runs_lease是租约索引。
- uq_runs_idempotency_key是幂等键唯一索引。
- uq_runs_thread_active是关键索引。每个thread最多一个pending或running运行。跨进程原子性保证。

这个索引必须在ORM的__table_args__里。

不能只在migration里。

原因是空数据库的bootstrap路径运行create_all加stamp head。

从不执行定义这个索引的migration。

- change_seq是变更序号。BigInteger。用于变更检测。

## 三、它和谁协作

- RunRepository读写这个模型。
- RunJournal在运行完成时写token用量。
- 多worker租约恢复消费lease_expires_at和cancel_action。
- persistence/base的Base提供序列化。

## 四、重要性评级

评级是8分。

理由如下。

这个模型是运行历史的中心行。

它承载状态、用量、所有权、幂等。

uq_runs_thread_active的跨进程唯一索引是并发正确性的关键。

它必须在ORM表参数里，注释解释了bootstrap路径的原因。

token用量按lead、subagent、middleware归因。

多worker的取消消费机制。

这些是多实例部署的基础。

扣掉2分。

扣分原因是它是纯数据行。

逻辑在repository和manager层。
