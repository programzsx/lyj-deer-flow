# ActiveScheduledTaskMutationConflict-档案

## 一、这个类是干什么的

ActiveScheduledTaskMutationConflict是persistence/scheduled_tasks/sql.py里的异常类。

它继承Exception。

它表示一个用户mutation和一个已admitted的scheduled-task occurrence竞争。

这个类位于backend/packages/harness/deerflow/persistence/scheduled_tasks/sql.py。

## 二、类的成员（字段，各自做什么）

### 1、字段

status是活跃occurrence的状态。

### 2、消息格式

消息是"scheduled task has an active {status} occurrence"。

### 3、mutation锁

PATCH、resume、pause、delete锁parent task。

冻结活跃task定义。

PATCH和resume拒绝所有活跃状态。

pause和delete原子取消queued工作。但拒绝launching和running。

只有queued冲突提供pause取消。

### 4、_lease_is_alive辅助函数

lease_expires_at为None时不活。

无时区时补UTC。

grace_seconds宽容时钟偏差。

## 三、它和谁协作

- ScheduledTaskRepository的mutation路径抛它。
- scheduler API捕获它返回409。

## 四、重要性评级

评级是4分。

理由如下。

这个类是scheduled task mutation冲突的信号。

带活跃状态。

mutation锁体系防止definition竞争。

_queued、launching、running的拒绝规则不同。

扣掉6分。

扣分原因是它是单行异常类。
