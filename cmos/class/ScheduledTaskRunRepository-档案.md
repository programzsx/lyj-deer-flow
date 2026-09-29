# ScheduledTaskRunRepository-档案

## 一、这个类是干什么的

ScheduledTaskRunRepository是persistence/scheduled_task_runs/sql.py里的类。

它是调度任务occurrence的持久仓库。

管理每个occurrence的claim、launch、状态。

它处理两个域异常。

ActiveScheduledRunConflict是并发dispatch已持有任务的活跃occurrence槽。

ScheduledTaskAdmissionRejected是父任务在队列准入前改变或消失。

这个类位于backend/packages/harness/deerflow/persistence/scheduled_task_runs/sql.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、ActiveScheduledRunConflict

并发dispatch已持有任务的活跃occurrence槽。

协调准入在插入queue行前对父任务串行。

部分唯一索引仍是直接仓库调用方和legacy交错的数据库backstop。

两条路径surface相同的域异常。

不让服务耦合SQLAlchemy错误。

### 2、ScheduledTaskAdmissionRejected

父任务在队列准入前改变或消失。

带task_id和reason。

### 3、_lease_is_alive

判断租约活着。

naive补UTC。加grace_seconds。

### 4、仓库职责

launch是租约fenced的claim。

occurrence状态流转queued、launching、running。

uq_scheduled_task_run_active部分唯一索引保证每任务一个活跃occurrence。

busy occurrence持久化为queued。

scheduler.queue_timeout_seconds界定持久等待。

## 三、它和谁协作

- ScheduledTaskRunRow是ORM行。
- ScheduledTaskRepository管理父任务。
- ScheduledTaskService消费。
- RunManager接管running状态。

## 四、重要性评级

评级是6分。

理由如下。

这个仓库是调度occurrence的持久层。

部分唯一索引防重复活跃occurrence。

域异常让服务不耦合SQLAlchemy。

租约grace处理。

queued的持久等待。

这些是调度正确性的关键。

扣掉4分。

扣分原因是它是数据访问层。
