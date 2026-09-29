# SubagentBatchItemRow-档案

## 一、这个类是干什么的

SubagentBatchItemRow是persistence/subagent_batches/model.py里的ORM模型。

它是一个subagent batch的一个item的行。

tablename是subagent_batch_items。

这个类位于backend/packages/harness/deerflow/persistence/subagent_batches/model.py。

## 二、类的成员（字段，各自做什么）

### 1、作用域字段

id是行id。主键。

batch_id是外键。指向subagent_batches.id。CASCADE删除。有索引。

item_key是item key。

position是位置。Integer。

### 2、内容字段

prompt是任务提示。Text。

acceptance_criteria是验收标准列表。JSON。可None。

acceptance_verdict是验收判定。JSON。可None。

### 3、状态字段

status是状态。有索引。

attempt是尝试次数。默认0。

lease_owner是lease owner。可None。

lease_expires_at是lease过期时间。

cancel_requested_at是取消请求时间。

### 4、结果字段

model_name是模型名。

result是结果文本。Text。可None。

result_preview是结果预览。可None。

result_truncated是结果是否截断。默认False。

error是错误。可None。

stop_reason是停止原因。

token_usage是token用量。JSON。

### 5、时间戳

started_at、completed_at、created_at、updated_at。

### 6、约束

uq_subagent_batch_items_key约束(batch_id, item_key)。

uq_subagent_batch_items_position约束(batch_id, position)。

ix_subagent_batch_items_claim索引(status, lease_expires_at, batch_id)。

支撑claim查询。

## 三、它和谁协作

- SubagentBatchRepository操作它。
- SubagentBatchRow是它的父batch。
- 独立的batch repository让历史保持可读。不依赖worker状态。

## 四、重要性评级

评级是5分。

理由如下。

这个类是batch item的持久化契约。

作用域、内容、状态、结果字段完整。

lease字段支撑claim和恢复。

唯一约束防重复key和位置。

claim索引支撑队列查询。

这些是durable batch执行的关键。

扣掉5分。

扣分原因是它是ORM行模型。逻辑在repository里。
