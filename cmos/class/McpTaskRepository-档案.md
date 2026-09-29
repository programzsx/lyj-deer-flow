# McpTaskRepository-档案

## 一、这个类是干什么的

McpTaskRepository是persistence/mcp_tasks/sql.py里的类。

它是MCP远程任务句柄的持久仓库。

一个用户对每个服务器只跟踪一个远程任务。

唯一约束uq_mcp_tasks_user_server_remote强制。

线程incarnation匹配防止旧incarnation的任务句柄复活。

这个类位于backend/packages/harness/deerflow/persistence/mcp_tasks/sql.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、错误类

DuplicateMcpRemoteTaskError是当前用户已跟踪该服务器的远程任务句柄。

McpTaskThreadMismatchError是提交的run不再拥有当前线程incarnation。

### 2、唯一冲突识别

_is_remote_task_unique_conflict识别远程任务唯一约束冲突。

Postgres的diag.constraint_name。

或消息里的约束名和列组合。

### 3、incarnation匹配

_matches_current_thread_incarnation原子匹配任务、当前线程、调用者捕获的incarnation。

is_not_distinct_from处理NULL。

user_id匹配或为None。

### 4、_lock_current_thread_incarnation

它锁期望的线程incarnation直到事务结束。

Postgres用with_for_update。

SQLite没有行级SELECT锁。

no-op UPDATE在检查或改MCP任务行前拿数据库写锁。

原始SQL避免触发updated_at的ORM onupdate钩子。

rowcount为1表示匹配。

### 5、事件指纹

_notification_event构建通知事件。

tracking_degraded标记跟踪降级。

_event_fingerprint计算事件指纹。

_record_event_if_changed只在变化时记录事件。

通知去重。

### 6、claim token

_new_claim_token生成claim token。

租约fence用。

## 三、它和谁协作

- McpTaskRow是ORM行。
- ThreadMetaRow提供incarnation。
- McpTaskService消费这个仓库。
- ThreadMetaStore管理线程。

## 四、重要性评级

评级是7分。

理由如下。

这个仓库是MCP远程任务持久化的核心。

唯一约束防重复任务句柄。

incarnation匹配防旧任务复活。

SQLite的no-op UPDATE锁方案绕过缺行级锁。

原始SQL防ORM钩子副作用。

通知事件指纹去重。

这些是MCP任务可靠性的关键。

扣掉3分。

扣分原因是它是数据访问层。
