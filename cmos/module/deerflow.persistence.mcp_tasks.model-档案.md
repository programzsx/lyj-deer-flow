# deerflow.persistence.mcp_tasks.model-档案

## 一、这个模块是干什么的

这个模块定义长时间运行的MCP任务的ORM模型。

模型类叫McpTaskRow。

模型对应数据库里的mcp_tasks表。

长时间运行的MCP任务走一个独立的持久化任务运行时。

Agent循环里只保留提交。

数据库是任务状态的唯一事实来源。

Agent循环不保留远端任务id。

Agent循环不做状态轮询。

这张表就是那个唯一事实来源。

## 二、模块里的主要成员

### 1、McpTaskRow类

McpTaskRow继承自Base。

McpTaskRow对应mcp_tasks表。

表由alembic迁移0011创建。

后续0012、0013、0019、0026扩展了列。

#### （1）标识字段

id是主键。

user_id是拥有者。

thread_id是提交线程。

run_id是提交运行。

tool_call_id是工具调用id。

thread_incarnation是线程化身。

#### （2）任务字段

server_name是MCP服务器名。

driver_name是驱动名。

remote_task_id是远端任务id。

task_name是任务名。

status是任务状态。

status有索引。

#### （3）结果字段

result是JSON结果。

result_preview是有界的结果预览。

result_truncated标记结果是否被截断。

result_artifact是结果工件。

error是错误信息。

input_required是输入请求。

driver_data是驱动数据。

#### （4）通知字段

notification_status是通知状态。

默认none。

notification_status有索引。

event_fingerprint是事件指纹。

event_version和notified_version是事件版本。

dispatch_version、dispatch_attempt、dispatch_event是分发状态。

notification_run_id是通知运行。

notification_error是通知错误。

notification_attempt_count是通知尝试次数。

next_notification_at是下次通知时间。

notification_lease_owner和notification_lease_expires_at是通知租约。

notification_lease_token是通知租约令牌。

#### （5）轮询字段

next_poll_at是下次轮询时间。

next_poll_at有索引。

last_polled_at是上次轮询时间。

last_poll_error是上次轮询错误。

poll_attempt_count是轮询次数。

consecutive_poll_error_count是连续错误次数。

#### （6）租约字段

lease_owner是租约持有者。

lease_expires_at是租约过期时间。

lease_token是租约令牌。

租约令牌让每个变更能锁定到确切的认领代。

#### （7）取消字段

cancel_requested_at是取消请求时间。

cancel_attempt_count是取消尝试次数。

next_cancel_at是下次取消时间。

last_cancel_error是上次取消错误。

#### （8）时间字段

completed_at是完成时间。

created_at和updated_at是创建和更新时间。

#### （9）约束和索引

有唯一约束(user_id, server_name, remote_task_id)。

一个用户对同一个服务器的同一个远端任务只能有一条记录。

有四个组合索引。

索引是thread_created、due、notification_due、cancel_due。

due索引服务轮询认领。

notification_due索引服务通知认领。

cancel_due索引服务取消认领。

## 三、它和谁协作

### 1、它依赖谁

它依赖deerflow.persistence.base的Base。

它依赖deerflow.constants的长度常量。

### 2、谁依赖它

mcp_tasks/sql.py的McpTaskRepository用McpTaskRow读写行。

McpTaskService通过repository管理任务生命周期。

thread_meta/model.py的ThreadMetaRow有对应的thread_incarnation列。

## 四、重要性评级

评级是8分。

理由如下。

长时间运行的MCP任务全靠这张表。

数据库是任务状态的唯一事实来源。

租约、轮询、通知、取消四套状态机全部落在这张表上。

唯一约束防止重复跟踪。

组合索引支撑三种worker的认领查询。

扣分的原因是字段非常多。

字段多但都是平铺的。

没有表间关系。
