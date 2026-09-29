# deerflow.persistence.subagent_batches-档案

源码路径：backend/packages/harness/deerflow/persistence/subagent_batches/__init__.py

## 一、这个包是干什么的

这个包负责subagent批量提交的持久化。

主agent可以一次提交一批subagent任务。

一批里有很多条目。

条目受并发上限控制。

条目有重试和验收标准。

这个包存批次和条目的状态、租约、结果。

这个包管理两张表。

表是subagent_batches和subagent_batch_items。

## 二、包里的主要成员

（1）model.py的两个Row

SubagentBatchRow对应subagent_batches表。

一行代表一个批次。

字段如下。

id是主键。

user_id和thread_id有索引。

run_id和tool_call_id关联提交来源。

submission_key是提交键。

title是批次标题。

subagent_type是subagent类型。

status是批次状态。

status有索引。

total_items是条目总数。

max_live_items是最大同时存活条目。

max_running_items是最大同时运行条目。

max_attempts是最大尝试次数。

execution_spec是执行规格JSON。

created_at、updated_at、completed_at是时间。

(user_id, submission_key)上有UNIQUE约束。

同样的提交不会重复入库。

(thread_id, created_at)有组合索引。

SubagentBatchItemRow对应subagent_batch_items表。

一行代表一个条目。

字段如下。

id是主键。

batch_id是外键。

指向subagent_batches.id。

级联删除。

batch_id有索引。

item_key是条目键。

position是顺序位置。

prompt是条目的提示词。

acceptance_criteria是验收标准列表。

acceptance_verdict是验收结论JSON。

status是条目状态。

status有索引。

attempt是尝试次数。

lease_owner和lease_expires_at是租约。

cancel_requested_at是取消请求时间。

model_name是用的模型。

result是完整结果文本。

result_preview是结果预览。

result_truncated标记截断。

error是错误。

stop_reason是停止原因。

token_usage是token用量JSON。

started_at、completed_at、created_at、updated_at是时间。

(batch_id, item_key)有唯一索引。

(batch_id, position)有唯一索引。

还有认领索引(status, lease_expires_at, batch_id)。

（2）sql.py的SubagentBatchRepository

这个类是批次和条目的仓库。

方法如下。

create_batch创建批次和条目。

get_batch查一个批次。

返回带各状态计数。

list_by_thread列出一个thread的批次。

list_items列出批次条目。

claim_items认领条目。

认领受max_live_items和max_running_items限制。

认领带租约。

renew_item_lease续条目租约。

mark_item_running标记条目运行中。

finalize_item完成条目。

写结果、验收结论、token用量。

requeue_item_after_admission_failure在准入失败后把条目放回队列。

pause_batch、resume_batch、cancel_batch是批次控制。

retry_item重试单个条目。

内部方法_refresh_batch_status刷新批次状态。

## 三、它和谁协作

Gateway的deps.py构造这个仓库。

durable subagent batch service是主要调用方。

这个服务在Gateway lifespan启动时构造一次。

subagent委派系统消费条目结果。

数据库表由持久层的Alembic引导创建。

migration 0016建了这两张表。

## 四、重要性评级

评级：5分。

理由：

批量subagent执行是高级委派功能。

批次和条目状态丢失会让批量任务中断。

租约和认领机制靠这两张表。

但这个功能是可选的。

普通单条subagent委派不经过这两张表。

运行核心路径不依赖它。

所以这个包是5分。
