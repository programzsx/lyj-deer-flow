# 0013_mcp_task_notifications档案

## 一、这个迁移是干什么的

给MCP任务加可靠通知和取消字段。给`runs`加幂等键索引。

任务状态变化后要可靠地通知。通知要重试。取消也要重试。这些都需要持久的版本计数和重试调度字段。

## 二、做了什么schema变更

- 给`runs`加`idempotency_key`列。String(255)。并创建唯一索引`uq_runs_idempotency_key`。
- 给`mcp_tasks`加14个列。event_fingerprint、event_version、notified_version、dispatch_version、dispatch_attempt、dispatch_event（JSON）、notification_run_id、notification_error、notification_attempt_count、next_notification_at、notification_lease_owner、notification_lease_expires_at、cancel_attempt_count、next_cancel_at、last_cancel_error。
- 创建索引`ix_mcp_tasks_notification_due`和`ix_mcp_tasks_cancel_due`。

## 三、涉及哪些表

`runs`和`mcp_tasks`。

## 四、重要细节

做数据播种。终态行（completed、failed、cancelled）不会再被轮询。为它们已经pending的通知播种一个outbox版本。非终态行在下次状态观察时拿到规范指纹。

索引创建幂等。全部列用safe_add_column。

## 五、重要性评级

评级是7分。

理由。这批字段让MCP任务的通知和取消可靠。通知可以重试。取消可以重试。幂等键让运行提交可以重放。outbox版本防止通知丢失或重复。
