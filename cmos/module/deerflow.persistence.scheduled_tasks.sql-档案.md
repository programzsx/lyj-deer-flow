# deerflow.persistence.scheduled_tasks.sql-档案

## 一、这个模块是干什么的

这个模块是定时任务的SQL仓库。

仓库类叫ScheduledTaskRepository。

这个模块读写scheduled_tasks表。

定时任务是用户定义的周期性任务。

这个模块管理任务的增删查改。

这个模块也管理调度的认领和恢复。

用户变更和已入队的出现之间存在竞态。

这个模块用父任务锁解决竞态。

## 二、模块里的主要成员

### 1、ScheduledTaskRepository类

这个类持有会话工厂。

这个类的方法覆盖任务全生命周期。

#### （1）create方法

create创建定时任务。

#### （2）get方法和get_internal方法

get按任务id取一条。

get校验user。

get_internal绕过user校验。

get_internal给内部worker用。

#### （3）list_by_user方法和list_by_user_and_thread方法

list_by_user列某用户的全部任务。

list_by_user_and_thread列某用户某线程的任务。

#### （4）get_active_run_status方法

查询任务的活跃出现状态。

#### （5）update方法

update修改任务定义。

活跃出现存在时用户变更会竞态。

竞态时抛ActiveScheduledTaskMutationConflict。

PATCH和resume在活跃状态下被拒绝。

#### （6）pause_with_queue_cancellation方法和delete_with_queue_cancellation方法

暂停和删除会原子取消queued的工作。

但拒绝launching和running的出现。

只有queued冲突提供暂停取消。

两个方法都先锁父任务。

#### （7）delete方法

delete删除任务。

#### （8）claim_due_tasks方法

认领到期的任务。

认领写入调度租约。

#### （9）claim_dispatch_lease方法和release_dispatch_lease方法

claim_dispatch_lease认领分发租约。

launching是短租约认领。

多个Gateway实例不能launch同一行。

release_dispatch_lease释放分发租约。

#### （10）update_after_launch方法

launch后更新任务。

更新next_run_at、last_run_id、run_count。

#### （11）complete_run方法

出现完成后完成任务。

once任务按ONCE_TASK_STATUS_BY_RUN_STATUS投影状态。

投影在同一个事务里。

#### （12）cancel_stuck_once_tasks方法和reconcile_stuck_once_tasks方法

cancel_stuck_once_tasks取消卡住的once任务。

reconcile_stuck_once_tasks调和卡住的once任务。

恢复锁按task-id加run-id顺序锁定任务和run对。

恢复在释放launch认领前还原run_id、started_at和活跃错误。

#### （13）release_queued_admission_lease方法

释放queued的准入租约。

### 2、辅助部分

_lock_task锁父任务行。

lease_is_alive判断租约是否活着。

_coerce_datetime把序列化的时间戳转回datetime。

时间戳在响应里是ISO字符串。

每个写入路径要在绑定DateTime字段前转回来。

ActiveScheduledTaskMutationConflict表示用户变更和活跃出现竞态。

## 三、它和谁协作

### 1、它依赖谁

它依赖scheduled_tasks/model.py的模型和常量。

它依赖scheduled_task_runs/projection的account_launch和can_project。

它依赖run/sql.py的RunRepository。

它依赖deerflow.scheduler.schedules的next_run_at计算下次运行时间。

### 2、谁依赖它

scheduler服务用它认领到期任务和推进调度。

Gateway的scheduled-tasks路由用它管理任务。

## 四、重要性评级

评级是8分。

理由如下。

定时任务的全部持久化逻辑在这里。

用户变更和出现的竞态用父锁解决。

launch、失败、超时更新用父优先的单事务。

once任务的调和逻辑在这里。

扣分的原因是定时任务是可选功能。

需要scheduler.enabled配置。

它和scheduled_task_runs一起工作。
