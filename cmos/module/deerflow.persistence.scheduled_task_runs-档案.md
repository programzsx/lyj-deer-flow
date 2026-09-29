# deerflow.persistence.scheduled_task_runs包档案

## 一、这个模块是干什么的

deerflow.persistence.scheduled_task_runs包是定时任务运行记录持久化的包门面。

源文件是backend/packages/harness/deerflow/persistence/scheduled_task_runs/__init__.py。

它的角色是立即导入式薄门面。

它把定时任务运行记录的ORM模型和SQL仓库一次性导入并暴露。

它没有懒加载。

它没有docstring。

它的价值在__all__清单上。

清单覆盖了模型、仓库和两个冲突错误类型。

## 二、模块里的主要成员

它用相对导入从两个模块导入成员。

model模块提供ScheduledTaskRunRow。

ScheduledTaskRunRow是定时任务运行记录的ORM行模型。

sql模块提供三个成员。

成员是ScheduledTaskRunRepository、ActiveScheduledRunConflict、ScheduledTaskAdmissionRejected。

ScheduledTaskRunRepository是运行记录仓库。

ActiveScheduledRunConflict表示活跃运行冲突。

ScheduledTaskAdmissionRejected表示运行准入被拒绝。

四个成员在__all__里。

两个错误类型是并发控制的防线。

同一个定时任务不能同时有多个活跃运行。

数据库层面用这两个错误强制约束。

## 三、它和谁协作

它向内聚合model和sql两个模块。

它向上被app.scheduler服务和网关消费。

定时任务触发时先做准入检查。

准入通过才创建运行记录。

它与deerflow.persistence.scheduled_tasks协作。

任务定义和任务运行记录是两张表。

任务表管定义。

运行记录表管每次执行。

它还被deerflow.persistence.models引用。

models子包把ScheduledTaskRunRow注册进Base.metadata。

## 四、重要性评级

评级是5分。

理由如下。

它是定时任务运行记录持久化的正式入口。

准入控制和活跃冲突的错误类型是定时任务不重跑的保障。

保障在数据库层面强制。

它参与models子包的ORM注册链条。

扣分点在于它没有docstring。

内容较少。

复杂度在sql模块里。
