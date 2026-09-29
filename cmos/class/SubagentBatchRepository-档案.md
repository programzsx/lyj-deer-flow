# SubagentBatchRepository-档案

## 一、这个类是干什么的

SubagentBatchRepository是persistence/subagent_batches/sql.py里的类。

它是持久的batch和item状态。

带基于租约的多worker claiming。

batch_task_tool把并行子代理任务批处理。

每个batch和item持久化。崩溃后恢复。

这个类位于backend/packages/harness/deerflow/persistence/subagent_batches/sql.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、SubagentBatchRow

id主键。user_id、thread_id、run_id、tool_call_id。

submission_key、title、subagent_type。

status。total_items、max_live_items、max_running_items、max_attempts。

execution_spec是JSON。

uq_subagent_batches_user_submission唯一约束。

同一用户同submission_key只一个batch。幂等。

### 2、SubagentBatchItemRow

batch_id外键。CASCADE删除。

item_key、position、prompt。

acceptance_criteria和acceptance_verdict是JSON。

status、attempt。

lease_owner、lease_expires_at、cancel_requested_at。

model_name、result、result_preview、result_truncated、error、stop_reason。

token_usage。

唯一约束是batch_id加item_key、batch_id加position。

claim索引是status、lease_expires_at、batch_id。

### 3、_batch_dict和_item_dict

_batch_dict返回稳定的owner面向投影。永不含执行上下文。

_execution_batch_dict返回worker-only字段。

重建执行所需。

_item_dict返回item投影。

acceptance_verdict验证。

include_result控制是否带result。

时间戳coerce_iso。

### 4、create_batch方法

创建batch和items。

status为queued。

## 三、它和谁协作

- batch_task_tool创建batch。
- 后台worker用execution_spec重建执行。
- lease字段支撑多worker claim。
- BatchItemInput是item输入。

## 四、重要性评级

评级是7分。

理由如下。

这个仓库是批处理子代理的持久核心。

租约claim支撑多worker。

owner投影和execution投影分开。执行上下文不泄露。

唯一约束防重复submission和position。

claim索引支撑领取查询。

acceptance验证。

这些是批处理可靠性的关键。

扣掉3分。

扣分原因是它是数据访问层。
