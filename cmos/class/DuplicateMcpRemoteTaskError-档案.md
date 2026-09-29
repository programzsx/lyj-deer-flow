# DuplicateMcpRemoteTaskError-档案

## 一、这个类是干什么的

DuplicateMcpRemoteTaskError是persistence/mcp_tasks/sql.py里的异常类。

它继承RuntimeError。

它表示当前用户已经在跟踪这个服务器的remote task handle。

这个文档覆盖DuplicateMcpRemoteTaskError加McpTaskThreadMismatchError。

位于backend/packages/harness/deerflow/persistence/mcp_tasks/sql.py。

## 二、类的成员（各自做什么）

### 1、DuplicateMcpRemoteTaskError

它继承RuntimeError。

当前用户已经跟踪这个服务器的remote task handle时抛出。

### 2、唯一约束

uq_mcp_tasks_user_server_remote约束。

_is_remote_task_unique_conflict检查约束名。

PostgreSQL用diag.constraint_name识别。

### 3、McpTaskThreadMismatchError

它继承RuntimeError。

提交的run不再拥有当前thread incarnation时抛出。

### 4、thread incarnation不匹配

incarnation防止已删除thread的写入重新创建状态。

提交run的incarnation和当前不一致时fail-loud。

## 三、它和谁协作

- McpTaskService的submit抛它们。
- Duplicate错误被重抛而不做补偿。补偿取消会终止已存在的tracked task。

## 四、重要性评级

评级是4分。

理由如下。

这两个类是MCP任务提交的边界信号。

重复任务和thread不匹配fail-loud。

唯一约束由数据库backstop。

Duplicate错误不做补偿。保护已存在的tracked task。

这些是MCP任务提交正确性的关键。

扣掉6分。

扣分原因是它们是单行异常类。
