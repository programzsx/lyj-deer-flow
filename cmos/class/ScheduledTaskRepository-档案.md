# ScheduledTaskRepository-档案

## 一、这个类是干什么的

ScheduledTaskRepository是persistence/scheduled_tasks/sql.py里的类。

它是调度任务的持久仓库。

管理调度任务行的CRUD。

 ActiveScheduledTaskMutationConflict是用户mutation和已准入的调度occurrence竞争时抛出。

status字段记录活跃occurrence的状态。

这个类位于backend/packages/harness/deerflow/persistence/scheduled_tasks/sql.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、ActiveScheduledTaskMutationConflict

用户mutation竞争了已准入的调度任务occurrence。

带status。

scheduled task有一个活跃的该状态occurrence。

### 2、_lease_is_alive函数

它判断租约是否活着。

lease_expires_at为None时死了。

naive时间补UTC。

加grace_seconds。

### 3、_coerce_datetime函数

它把序列化的任务时间戳转回。再绑定DateTime字段。

_TIMESTAMP_KEYS是created_at、updated_at、next_run_at、last_run_at、lease_expires_at。

_row_to_dict序列化成ISO字符串。

每个写路径必须coerce回去再绑定。

Z后缀转成加00:00。

naive补UTC。

### 4、ScheduledTaskRepository本身

CRUD调度任务行。

和ScheduledTaskRunRepository配合。

launch是租约fenced的claim。

uq_scheduled_task_run_active部分唯一索引是数据库backstop。

## 三、它和谁协作

- ScheduledTaskRow是ORM行。
- ScheduledTaskRunRepository管理occurrence。
- ScheduledTaskService消费两个仓库。
- next_run_at计算下次运行。

## 四、重要性评级

评级是6分。

理由如下。

这个仓库是调度任务的持久层。

lease_is_alive的grace处理。

_coerce_datetime处理SQLite时区丢弃。

mutation冲突异常区分。

这些是调度正确性的关键。

扣掉4分。

扣分原因是它是数据访问层。
