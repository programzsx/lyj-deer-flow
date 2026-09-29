# 0016_subagent_batches档案

## 一、这个迁移是干什么的

创建原生子代理批次的两张表。持久的子代理批次。一个批次里有多个子代理项。每项可以独立领取、重试、取消。

## 二、做了什么schema变更

- 创建`subagent_batches`表。id、user_id、thread_id、run_id、tool_call_id、submission_key、title、subagent_type、status、total_items、max_live_items、max_running_items、max_attempts、execution_spec（JSON）、时间字段。
- 唯一约束`uq_subagent_batches_user_submission`。同一用户的提交键不重复。
- 创建`subagent_batch_items`表。每项的prompt、status、attempt、租约字段、取消请求、模型名、结果、结果预览、截断标志、错误、stop_reason、token用量。外键关联batch，级联删除。
- 唯一约束。batch加item_key、batch加position。
- 三个索引。包括领取用的claim索引。

## 三、涉及哪些表

`subagent_batches`和`subagent_batch_items`。

## 四、重要细节

幂等。表已存在就跳过。claim索引按（status, lease_expires_at, batch_id）支持工作项的租约领取。

## 五、重要性评级

评级是6分。

理由。这两张表是原生子代理批次的持久化基础。批次里有多个项。每项独立领取和重试。claim索引支持租约领取。没有它们，批次执行就没有持久状态。
