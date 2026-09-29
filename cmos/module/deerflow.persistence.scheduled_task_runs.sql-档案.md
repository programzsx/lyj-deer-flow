# deerflow.persistence.scheduled_task_runs.sql-档案

## 一、这个模块是干什么的

这个模块是定时任务每次执行的SQL仓库。

仓库类叫ScheduledTaskRunRepository。

这个模块读写scheduled_task_runs表。

每次定时任务执行对应一行。

这个模块管理出现的创建、排队、认领、恢复、完成。

多实例调度的并发安全主要在这个模块。

## 二、模块里的主要成员

### 1、ScheduledTaskRunRepository类

这个类持有会话工厂。

这个类的方法覆盖出现全生命周期。

#### （1）create方法

create创建出现行。

创建前先锁父任务。

协调准入在父任务上串行化。

然后插入排队行。

部分唯一索引是数据库层面的兜底。

#### （2）list_by_task方法

列出某任务的全部出现。

#### （3）count_active_runs方法

统计launching和running的出现数。

计数用于max_concurrent_runs的全局预算。

#### （4）list_queued_runs方法

列出排队中的出现。

排队是有意的持久状态。

重启后排队行还在。

#### （5）get_active_run方法

取某任务的活跃出现。

#### （6）claim_queued_run方法

认领一个排队出现。

认领把queued变成launching。

认领写租约。

原子排队认领强制max_concurrent_runs。

等待的行不计入预算。

Postgres用advisory锁串行化。

SQLite用BEGIN IMMEDIATE。

预算计数和UPDATE是分开的语句。

写入者必须在计数前串行化。

否则不同行上的认领会超出上限。

重复触发会合并。

同线程FIFO排在旧活跃行后面。

#### （7）requeue_claimed_run方法

被复用线程的ConflictError时。

launching退回queued。

#### （8）expire_queued_runs方法

排队超时的出现被标记失败。

queue_timeout_seconds限制持久的等待。

超时后失败并推进调度。

防止立即重新排队。

#### （9）fail_launching_run方法

launch失败时把出现标成failed。

#### （10）reconcile_launched_run方法

调和已launch的出现。

恢复run_id、started_at和活跃错误。

#### （11）recover_expired_launch_claims方法

过期的launch认领回到持久队列。

恢复的行重新变成queued。

多实例恢复靠这个方法。

#### （12）update_status方法

更新出现状态。

状态转换有守卫。

#### （13）has_active_runs方法

判断任务是否有活跃出现。

#### （14）mark_stale_active_runs方法和reconcile_active_runs方法

mark_stale_active_runs标记陈旧的活跃出现。

reconcile_active_runs调和活跃出现。

恢复在锁内检查底层run。

活着的run被保留。

过期run租约的被原子接管。

陈旧的launch写入被租约拥有者围栏。

#### （15）_find_underlying_run方法

查找出现对应的底层Gateway run。

### 2、异常类

ActiveScheduledRunConflict表示并发分发已持有任务的活跃出现槽位。

ScheduledTaskAdmissionRejected表示准入被拒绝。

拒绝原因在reason字段。

## 三、它和谁协作

### 1、它依赖谁

它依赖scheduled_task_runs/model.py的ScheduledTaskRunRow。

它依赖scheduled_task_runs/projection的account_launch和can_project。

它依赖scheduled_tasks/model.py的常量。

它依赖run/sql.py的RunRepository。

它依赖deerflow.scheduler.schedules的next_run_at。

### 2、谁依赖它

scheduler服务用它排队和认领出现。

scheduled_tasks/sql.py用它查询活跃状态。

## 四、重要性评级

评级是8分。

理由如下。

定时任务出现的全部状态机在这里。

多实例调度的并发安全主要在这里。

排队认领的预算逻辑很精细。

恢复和调和逻辑完整。

扣分的原因是定时任务是可选功能。

它和scheduled_tasks/sql.py一起构成一条链路。

逻辑只服务这一条链路。
