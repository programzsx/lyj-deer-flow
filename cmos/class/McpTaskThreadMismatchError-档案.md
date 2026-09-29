# McpTaskThreadMismatchError-档案

## 一、这个类是干什么的

McpTaskThreadMismatchError是persistence/mcp_tasks/sql.py里的异常类。

它继承RuntimeError。

它表示提交的run不再拥有当前thread incarnation。

这个类位于backend/packages/harness/deerflow/persistence/mcp_tasks/sql.py。

## 二、类的成员（各自做什么）

### 1、继承关系

McpTaskThreadMismatchError继承RuntimeError。

### 2、语义

提交的run的thread incarnation和当前不一致时抛出。

incarnation是thread化身。

防止已删除thread的写入重新创建状态。

## 三、它和谁协作

- McpTaskService的submit抛它。
- McpTaskRepository的admission检查触发它。

## 四、重要性评级

评级是3分。

理由如下。

这个类是thread incarnation不匹配的信号。

fail-loud。防止为已删除的thread创建任务状态。

单行异常类。

扣掉7分。

扣分原因是它是单行异常类。
