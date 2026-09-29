# deerflow.persistence.scheduled_task_runs-档案

源码路径：backend/packages/harness/deerflow/persistence/scheduled_task_runs/__init__.py

## 一、这个包是干什么的

这个包负责定时任务每次实际执行记录的持久化。

定时任务是cron式的任务。

任务定义在scheduled_tasks包。

每次到期触发就产生一条执行记录。

这个包存每次执行的状态、租约、错误。

这个包对应数据库里的scheduled_task_runs表。

## 二、包里的主要成员

（1）model.py的ScheduledTaskRunRow

ScheduledTaskRunRow对应scheduled_task_runs表。

一行代表一次定时任务执行。

字段如下。

id是主键。

task_id是哪个任务。

task_id有索引。

occurrence_seq是发生序号。

NULL表示遗留历史或无父任务的直接插入。

launch_accounted标记启动是否已计数。

新发生从False开始。

NULL保留未知遗留的计数。

thread_id是执行所在的会话。

thread_id有索引。

run_id关联durable run。

scheduled_for是预定时间。

trigger是触发方式。

status是状态。

status有索引。

error是错误文本。

lease_owner和lease_expires_at是租约。

attempt_count是尝试次数。

started_at和finished_at是起止时间。

created_at是创建时间。

索引如下。

(task_id, occurrence_seq)有唯一索引。

还有uq_scheduled_task_run_active部分唯一索引。

一个任务最多一个queued、launching或running的发生。

queued发生是故意持久的。

launching是短命的租约隔离认领。

多个gateway实例不能launch同一行。

这个索引是runs表uq_runs_thread_active的兄弟。

runs那个按thread_id键。

fresh_thread_per_run上下文每次分发都有新thread。

runs的索引不覆盖这种情况。

所以这里需要自己的守卫。

索引必须放在ORM的__table_args__里。

空库bootstrap走create_all加stamp head。

那条路径不执行migration。

（2）projection.py的投影逻辑

can_project判断发生是否是当前投影。

未排序的历史保持尽力而为。

account_launch把一次已证实的启动计一次数。

计数和标记在同一个事务里。

迁移来的NULL标记第一次修复用旧的last_run_id推断。

历史计数无法从发生时间重建。

（3）sql.py的ScheduledTaskRunRepository

这个类是执行记录的仓库。

方法如下。

create创建执行记录。

list_by_task列出一个任务的执行。

count_active_runs统计活跃执行数。

list_queued_runs列出排队的执行。

get_active_run取任务当前活跃执行。

claim_queued_run认领排队的执行。

认领带租约。

requeue_claimed_run把认领的执行放回队列。

expire_queued_runs让超时的排队执行过期。

fail_launching_run把launching的执行标为失败。

reconcile_launched_run对账已启动的执行。

recover_expired_launch_claims恢复过期的launch认领。

update_status更新状态。

has_active_runs判断是否有活跃执行。

mark_stale_active_runs标记过期的活跃执行。

reconcile_active_runs对账活跃执行。

异常类有两个。

ActiveScheduledRunConflict表示已有活跃执行。

ScheduledTaskAdmissionRejected表示准入被拒。

## 三、它和谁协作

Gateway的deps.py构造这个仓库。

app.scheduler.service是主要调用方。

调度器循环用它认领和更新执行。

scheduled_tasks包的仓库和它协作。

两边的锁顺序是先锁父任务再锁发生记录。

runs表通过run_id关联。

数据库表由持久层的Alembic引导创建。

migration 0016建了这张表。

## 四、重要性评级

评级：7分。

理由：

定时任务的执行历史靠这个包。

排队、认领、恢复机制靠这张表。

部分唯一索引防止任务重复执行。

但定时任务是可选功能。

需要config.yaml里开启scheduler.enabled。

不用定时任务的部署不碰这张表。

所以这个包是7分。
