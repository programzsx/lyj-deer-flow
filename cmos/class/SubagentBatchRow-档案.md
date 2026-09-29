# SubagentBatchRow-档案

## 一、这个类是干什么的

SubagentBatchRow是persistence/subagent_batches/model.py里的ORM模型。

说明。

这个文件定义持久化批量任务的两个模型。

SubagentBatchRow是批次行。

SubagentBatchItemRow是条目行。

批量模式处理大量独立的原生子代理条目。

批次行定义批次的提交和限制。

条目行定义每个条目的状态和结果。

这个文件位于backend/packages/harness/deerflow/persistence/subagent_batches/model.py。

## 二、类的成员（字段，各自做什么）

### 1、SubagentBatchRow字段

- id是批次主键。
- user_id、thread_id是身份字段。thread_id有索引。
- run_id和tool_call_id是关联字段。
- submission_key是提交键。幂等身份。
- title是显示给用户的短批次名。
- subagent_type是每个条目用的原生子代理定义。
- status是批次状态。有索引。
- total_items是总条目数。
- max_live_items是排队加运行条目窗口。
- max_running_items是每批次真实执行并发。
- max_attempts是最大尝试。
- execution_spec是JSON列的执行细节。包括子代理配置、模型、身份属性、知识范围。
- created_at、updated_at、completed_at是时间。

表级约束是uq_subagent_batches_user_submission。

这是(user_id, submission_key)的唯一约束。

重试复用key作为幂等身份。

### 2、SubagentBatchItemRow字段

- id是条目主键。
- batch_id是父批次。外键级联删除。有索引。
- item_key是条目键。长度128。
- position是条目位置。
- prompt是条目任务。
- acceptance_criteria是JSON列的验收标准。
- acceptance_verdict是JSON列的验收裁决。
- status是条目状态。有索引。
- attempt是尝试计数。
- lease_owner和lease_expires_at是条目租约。
- cancel_requested_at是取消请求。
- model_name、result、result_preview、result_truncated、error、stop_reason、token_usage是结果字段。
- started_at、completed_at、created_at、updated_at是时间。

表级约束包括三条。

uq_subagent_batch_items_key是(batch_id, item_key)唯一约束。

uq_subagent_batch_items_position是(batch_id, position)唯一约束。

ix_subagent_batch_items_claim是(status, lease_expires_at, batch_id)的claim索引。

## 三、它和谁协作

- SubagentBatchRepository读写这些模型。
- SubagentBatchService管理批次生命周期。
- SubagentBatchSubmitter提交批次。
- persistence/base的Base提供序列化。

## 四、重要性评级

评级是6分。

理由如下。

这两个模型是持久化批次的存储基础。

submission_key的幂等约束让重试安全。

条目行的claim索引支撑租约服务。

验收标准和裁决分开存储。

execution_spec持久化让恢复项保持执行细节。

但它是纯数据行。

扣掉4分。
