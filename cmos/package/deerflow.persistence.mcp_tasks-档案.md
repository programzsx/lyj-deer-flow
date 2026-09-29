# deerflow.persistence.mcp_tasks-档案

源码路径：backend/packages/harness/deerflow/persistence/mcp_tasks/__init__.py

## 一、这个包是干什么的

这个包负责长时间运行的MCP任务的持久化。

MCP远程任务可能跑几分钟甚至更久。

这些任务不能留在Agent循环里轮询。

数据库是任务生命周期的唯一可信来源。

这个包存任务状态、结果、租约、通知状态。

这个包对应数据库里的mcp_tasks表。

## 二、包里的主要成员

（1）model.py的McpTaskRow

McpTaskRow对应mcp_tasks表。

一行代表一个被跟踪的远程任务。

这张表字段非常多。

核心身份字段如下。

id是任务主键。

user_id和thread_id有索引。

thread_incarnation记录提交时的thread化身。

run_id和tool_call_id关联发起任务的位置。

server_name和driver_name标识MCP服务器。

remote_task_id是远端的任务句柄。

task_name是任务名。

状态字段是status。

status有索引。

结果字段如下。

result是完整结果JSON。

result_preview是结果预览。

result_truncated标记结果是否被截断。

result_artifact是结果工件。

error是错误信息。

input_required是需要用户输入时的信息。

生命周期字段如下。

租约有lease_owner、lease_expires_at、lease_token。

轮询有next_poll_at、last_polled_at、last_poll_error。

轮询还有poll_attempt_count、consecutive_poll_error_count。

通知有notification_status、next_notification_at、notification_run_id。

通知还有notification_error、notification_attempt_count。

通知租约有notification_lease_owner、notification_lease_expires_at、notification_lease_token。

取消有cancel_requested_at、next_cancel_at、last_cancel_error、cancel_attempt_count。

事件去重有event_fingerprint、event_version、notified_version。

分发有dispatch_version、dispatch_attempt、dispatch_event。

(user_id, server_name, remote_task_id)上有UNIQUE约束。

一个用户对同一个服务器的同一个远程句柄只有一行。

（2）sql.py的McpTaskRepository

这个类是任务生命周期的持久化可信来源。

方法如下。

create创建任务行。

create先锁当前thread化身。

锁用SELECT FOR UPDATE。

SQLite用no-op UPDATE拿写锁。

锁失败抛McpTaskThreadMismatchError。

提交跨过了thread生命周期边界。

UNIQUE冲突转成DuplicateMcpRemoteTaskError。

get按task_id查一个任务。

list_by_thread列出一个thread的任务。

claim_due_tasks领取到期任务。

领取带租约token。

token用来隔离释放和重新领取。

apply_snapshot应用轮询快照。

release_claim释放领取租约。

request_cancel记录取消请求。

claim_cancel_requests领取取消请求。

apply_cancel_snapshot应用取消结果。

release_cancel_claim释放取消租约。

claim_notification_work领取通知工作。

mark_notification_dispatched标记通知已分发。

release_notification_claim释放通知租约。

finish_notification_run完成通知run。

release_notification_lease释放通知租约。

dead_letter_notification把通知送入死信。

defer_dispatched_notification推迟已分发的通知。

（3）事件去重机制

_notification_event构造通知事件。

只有attention状态或tracking降级时才有事件。

事件指纹是内容的SHA-256。

指纹没变就不重新通知。

_record_event_if_changed在指纹变化时递增event_version。

## 三、它和谁协作

app.mcp_tasks.service是主要调用方。

McpTaskService用这个仓库管理任务生命周期。

Gateway的deps.py构造这个仓库。

thread_incarnation校验依赖thread_meta包的ThreadMetaRow。

状态词汇表来自deerflow.mcp.tasks。

lease和恢复机制和scheduler的设计同源。

数据库表由持久层的Alembic引导创建。

migration 0011建了这张表。

## 四、重要性评级

评级：7分。

理由：

长时间MCP任务的持久化是这个子系统的基础。

没有这个包任务状态就无处可查。

租约和恢复机制依赖这张表。

但MCP长任务本身是可选的高级功能。

普通短任务不经过这张表。

run和thread_meta的核心路径不依赖它。

所以这个包是7分。
