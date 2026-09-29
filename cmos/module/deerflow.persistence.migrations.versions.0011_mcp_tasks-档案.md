# 0011_mcp_tasks档案

## 一、这个迁移是干什么的

创建`mcp_tasks`表。持久的长时间运行MCP任务。

长运行的MCP工作用独立的持久任务运行时。不把远程任务id和状态轮询放进Agent循环。只有提交对Agent可见。数据库是事实来源。

## 二、做了什么schema变更

- 创建`mcp_tasks`表。id、user_id、thread_id、run_id、tool_call_id、server_name、driver_name、remote_task_id、task_name、status、result（JSON）、error、input_required（JSON）、driver_data（JSON）、notification_status、轮询相关字段（next_poll_at、last_polled_at、last_poll_error、poll_attempt_count、consecutive_poll_error_count）、租约字段（lease_owner、lease_expires_at）、取消字段、完成时间。
- 唯一约束`uq_mcp_tasks_user_server_remote`。同一用户同一服务器的远程任务id不重复。
- 七个索引。用户、thread、状态、通知状态、next_poll_at、thread加created、到期。

## 三、涉及哪些表

只涉及`mcp_tasks`表。

## 四、重要细节

幂等。表已存在直接返回。

这个表是MCP任务运行时的全部基础。状态轮询、租约恢复、取消、通知都依赖这些字段。

## 五、重要性评级

评级是7分。

理由。mcp_tasks是长运行MCP任务的全部持久化基础。没有它，长运行的MCP工作就得放进Agent循环。Agent会被远程任务的状态轮询拖住。
