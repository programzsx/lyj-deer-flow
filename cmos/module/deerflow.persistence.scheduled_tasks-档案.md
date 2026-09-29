# deerflow.persistence.scheduled_tasks包档案

## 一、这个模块是干什么的

deerflow.persistence.scheduled_tasks包是定时任务定义持久化的包门面。

源文件是backend/packages/harness/deerflow/persistence/scheduled_tasks/__init__.py。

它的角色是立即导入式薄门面。

它把定时任务定义的ORM模型和SQL仓库一次性导入并暴露。

它没有懒加载。

它没有docstring。

它的价值在__all__清单上。

清单覆盖了模型、仓库和一个冲突错误类型。

## 二、模块里的主要成员

它用相对导入从两个模块导入成员。

model模块提供ScheduledTaskRow。

ScheduledTaskRow是定时任务定义的ORM行模型。

sql模块提供两个成员。

成员是ScheduledTaskRepository、ActiveScheduledTaskMutationConflict。

ScheduledTaskRepository是任务定义仓库。

ActiveScheduledTaskMutationConflict表示任务有活跃运行时的修改冲突。

三个成员在__all__里。

错误类型是并发修改的防线。

任务正在运行时不能修改定义。

数据库层面用这个错误强制约束。

## 三、它和谁协作

它向内聚合model和sql两个模块。

它向上被app.scheduler服务和网关消费。

定时任务的创建、更新、删除走这里。

它与deerflow.persistence.scheduled_task_runs协作。

定义表和运行记录表是两张表。

它还与deerflow.scheduler协作。

harness层提供cron表达式解析。

解析结果存进这里的行模型。

它还被deerflow.persistence.models引用。

models子包把ScheduledTaskRow注册进Base.metadata。

## 四、重要性评级

评级是5分。

理由如下。

它是定时任务定义持久化的正式入口。

活跃修改冲突的错误类型是任务执行期间不被篡改的保障。

它参与models子包的ORM注册链条。

扣分点在于它没有docstring。

内容较少。

复杂度在sql模块里。
