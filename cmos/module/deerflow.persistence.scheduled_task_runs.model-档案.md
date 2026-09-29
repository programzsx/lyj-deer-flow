# deerflow.persistence.scheduled_task_runs.model-档案

## 一、这个模块是干什么的

这个模块定义定时任务每次执行的ORM模型。

模型类叫ScheduledTaskRunRow。

模型对应数据库里的scheduled_task_runs表。

定时任务每次到点触发一次出现。

每次出现对应一行。

出现有完整的状态生命周期。

出现从queued到launching到running。

最后到success或failed等终态。

## 二、模块里的主要成员

### 1、ScheduledTaskRunRow类

ScheduledTaskRunRow继承自Base。

ScheduledTaskRunRow对应scheduled_task_runs表。

表由alembic迁移0003创建。

后续0015、0019、0022扩展了列。

#### （1）标识字段

id是主键。

task_id是所属任务。

task_id有索引。

thread_id是运行线程。

thread_id有索引。

run_id是关联的Gateway运行。

run_id可空。

#### （2）序号字段

occurrence_seq是出现序号。

BigInteger类型。

occurrence_seq可空。

NULL标识legacy历史或没有父任务的直接插入。

occurrence_seq和task_id有唯一索引。

一个任务内序号不能重复。

launch_accounted是launch是否已被计数。

可空布尔。

新出现从False开始。

NULL保留未知的legacy计数。

#### （3）调度字段

scheduled_for是计划执行时间。

trigger是触发方式。

#### （4）状态字段

status是出现状态。

status有索引。

状态词汇由scheduled_tasks/model.py的ScheduledTaskRunStatus定义。

error是错误信息。

#### （5）租约字段

lease_owner是租约持有者。

lease_expires_at是租约过期时间。

attempt_count是尝试次数。

#### （6）时间字段

started_at是开始时间。

finished_at是结束时间。

created_at是创建时间。

#### （7）约束和索引

有唯一索引(task_id, occurrence_seq)。

索引名叫uq_scheduled_task_run_occurrence_seq。

有部分唯一索引uq_scheduled_task_run_active。

条件是status IN (queued, launching, running)。

一个任务最多有一个非终态出现。

queued是有意持久的。

launching是短租约认领。

多个gateway实例不能launch同一行。

这个索引是runs表uq_runs_thread_active的兄弟。

runs那个索引按thread_id做键。

runs那个不覆盖fresh_thread_per_run上下文。

每次分发都用新线程。

所以定时任务的行需要自己的守卫。

这个索引必须放在ORM的__table_args__里。

原因是空库引导路径跑create_all加stamp head。

那条路径不执行定义这个索引的迁移。

## 三、它和谁协作

### 1、它依赖谁

它依赖deerflow.persistence.base的Base。

### 2、谁依赖它

scheduled_task_runs/sql.py的ScheduledTaskRunRepository用这个模型读写。

scheduled_tasks/sql.py导入ScheduledTaskRunRow查询出现。

migrations/versions/0003_scheduled_tasks.py创建这张表。

0007_scheduled_run_active_index.py加活跃唯一索引。

## 四、重要性评级

评级是7分。

理由如下。

定时任务的每次执行全靠这张表记录。

部分唯一索引uq_scheduled_task_run_active是并发调度的关键守卫。

occurrence_seq的序号设计支撑防重复计数。

扣分的原因是它是纯模型文件。

没有读写逻辑。

定时任务是可选功能。
