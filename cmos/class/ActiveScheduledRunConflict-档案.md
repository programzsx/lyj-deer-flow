# ActiveScheduledRunConflict-档案

## 一、这个类是干什么的

ActiveScheduledRunConflict是persistence/scheduled_task_runs/sql.py里的异常类。

它继承Exception。

它表示一个并发dispatch已持有task的active-occurrence槽位。

这个文档覆盖ActiveScheduledRunConflict加ScheduledTaskAdmissionRejected。

位于backend/packages/harness/deerflow/persistence/scheduled_task_runs/sql.py。

## 二、类的成员（字段，各自做什么）

### 1、ActiveScheduledRunConflict字段

task_id是冲突的task id。

### 2、ActiveScheduledRunConflict语义

一个并发dispatch已持有task的active-occurrence槽位时抛出。

协调admission在插入queue行之前在parent task上串行化。

部分唯一索引是数据库backstop。给直接的repository调用者和legacy交错用。

两条路径surface相同的域异常。不把service耦合到SQLAlchemy错误。

### 3、ScheduledTaskAdmissionRejected

它继承Exception。

parent task在queue admission之前改变或消失时抛出。

字段是task_id加reason。

消息带task和reason。

### 4、admission幂等

uq_scheduled_task_run_active约束(task_id WHERE status IN queued、launching、running)。

重复trigger合并。

## 三、它和谁协作

- ScheduledTaskRunRepository的claim和insert抛它们。
- scheduler服务捕获它们决定错误处理。

## 四、重要性评级

评级是5分。

理由如下。

这两个类是scheduled task admission的域异常。

并发冲突和admission拒绝分开。

域异常不耦合SQLAlchemy错误。

数据库唯一索引是backstop。

带task_id和reason。方便排障。

这些是调度admission正确性的关键。

扣掉5分。

扣分原因是它们是异常信号类。
