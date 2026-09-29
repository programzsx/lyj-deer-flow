# deerflow.persistence.subagent_batches.model-档案

## 一、这个模块是干什么的

这个模块定义原生subagent批处理的ORM模型。

模型类是SubagentBatchRow和SubagentBatchItemRow。

两个模型对应两张表。

两张表是subagent_batches和subagent_batch_items。

批处理是一次提交多个subagent条目。

条目并行执行。

执行有并发上限和重试上限。

批处理和条目都持久化。

重启后批处理可以恢复。

## 二、模块里的主要成员

### 1、SubagentBatchRow类

SubagentBatchRow对应subagent_batches表。

一行代表一次批处理提交。

表由alembic迁移0016创建。

#### （1）标识字段

id是主键。

user_id是拥有者。

user_id有索引。

thread_id是所属线程。

thread_id有索引。

run_id是提交运行。

tool_call_id是工具调用id。

#### （2）提交字段

submission_key是提交键。

title是批处理标题。

subagent_type是subagent类型。

有唯一约束(user_id, submission_key)。

同一个用户的同一个提交不能重复。

#### （3）并发控制字段

total_items是条目总数。

max_live_items是最大存活条目数。

max_running_items是最大同时运行条目数。

max_attempts是最大尝试次数。

execution_spec是JSON执行规格。

#### （4）状态和时间字段

status是批处理状态。

status有索引。

created_at和updated_at是创建和更新时间。

completed_at是完成时间。

有索引(thread_id, created_at)。

### 2、SubagentBatchItemRow类

SubagentBatchItemRow对应subagent_batch_items表。

一行代表批处理里的一个条目。

#### （1）标识字段

id是主键。

batch_id是所属批处理。

batch_id是外键。

级联删除。

batch_id有索引。

item_key是条目键。

position是条目位置。

有唯一约束(batch_id, item_key)。

有唯一约束(batch_id, position)。

#### （2）执行字段

prompt是条目提示词。

Text类型。

acceptance_criteria是JSON验收标准。

可空。

acceptance_verdict是JSON验收裁决。

可空。

model_name是使用的模型。

result是条目结果。

Text类型。

result_preview是有界预览。

result_truncated标记是否截断。

error是错误信息。

stop_reason是停止原因。

token_usage是JSON token用量。

#### （3）租约和状态字段

status是条目状态。

status有索引。

attempt是尝试次数。

lease_owner和lease_expires_at是租约。

cancel_requested_at是取消请求时间。

started_at和completed_at是开始和结束时间。

#### （4）约束和索引

有索引(batch_id, status, lease_expires_at)。

索引名叫ix_subagent_batch_items_claim。

claim查询走这个索引。

## 三、它和谁协作

### 1、它依赖谁

它依赖deerflow.persistence.base的Base。

### 2、谁依赖它

subagent_batches/sql.py的SubagentBatchRepository用这两个模型读写。

migrations/versions/0016_subagent_batches.py创建这两张表。

0021_batch_acceptance.py加验收字段。

bootstrap.py的canonical-0019 floor列出这两张表的列。

## 四、重要性评级

评级是6分。

理由如下。

原生subagent批处理的数据结构在这里。

提交幂等的唯一约束在这里。

条目身份和位置的唯一约束在这里。

claim索引支撑条目认领查询。

扣分的原因是它是纯模型文件。

没有读写逻辑。

批处理是较新的功能。
