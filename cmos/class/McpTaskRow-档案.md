# McpTaskRow-档案

## 一、这个类是干什么的

McpTaskRow是persistence/mcp_tasks/model.py里的ORM模型。

这个类是MCP长任务的持久化行。

mcp_tasks表。

每个长任务一行。

这个行承载远程任务的完整状态。

包括轮询租约、取消租约、通知租约三组独立的生命周期字段。

字段长度用constants模块的常量。

SQLite不能接受PostgreSQL以后在VARCHAR边界拒绝的值。

这个类位于backend/packages/harness/deerflow/persistence/mcp_tasks/model.py。

## 二、类的成员（字段，各自做什么）

### 1、标识字段

- id是本地任务id主键。
- user_id、thread_id、thread_incarnation是身份字段。
- run_id和tool_call_id是关联字段。
- server_name、driver_name、remote_task_id是远程任务字段。长度用常量。
- task_name是任务名。

### 2、状态与结果字段

- status是任务状态。有索引。
- result是JSON列的完整结果。
- result_preview是预览文本。
- result_truncated标记结果被截断。
- result_artifact是结果artifact。
- error是错误文本。
- input_required是输入请求载荷。
- driver_data是driver数据。

### 3、轮询生命周期字段

- next_poll_at是下次轮询时间。有索引。
- last_polled_at和last_poll_error。
- poll_attempt_count和consecutive_poll_error_count。
- lease_owner、lease_expires_at、lease_token是轮询租约。

### 4、通知生命周期字段

- notification_status是通知状态。默认none。有索引。
- event_fingerprint和event_version是投递幂等。
- notified_version和dispatch_version是版本跟踪。
- dispatch_attempt和dispatch_event是派发重试。
- notification_run_id、notification_error、notification_attempt_count。
- next_notification_at。
- notification_lease_owner、notification_lease_expires_at、notification_lease_token是通知租约。

### 5、取消生命周期字段

- cancel_requested_at是取消请求时间。
- cancel_attempt_count、next_cancel_at、last_cancel_error是取消重试。

### 6、时间字段

- completed_at、created_at、updated_at。

## 三、它和谁协作

- McpTaskRepository读写这个模型。
- McpTaskService轮询和取消时消费租约字段。
- constants模块提供字段长度常量。
- persistence/base的Base提供序列化。

## 四、重要性评级

评级是7分。

理由如下。

这个模型是MCP长任务的完整持久化行。

三组独立的生命周期（轮询、取消、通知）各有自己的租约和重试字段。

这是租约恢复的基础。

字段长度用共享常量保证SQLite和PostgreSQL一致。

event_fingerprint提供投递幂等。

但它是纯数据行。

逻辑在repository和服务层。

扣掉3分。
