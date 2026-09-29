# deerflow.persistence.scheduled_tasks-档案

源码路径：backend/packages/harness/deerflow/persistence/scheduled_tasks/__init__.py

## 一、这个包是干什么的

这个包负责定时任务定义的持久化。

定时任务是cron式的后台任务。

任务由用户创建。

任务定义了什么时候跑、跑什么提示词、在哪个时区。

这个包存任务定义和调度状态。

这个包对应数据库里的scheduled_tasks表。

## 二、包里的主要成员

（1）model.py的ScheduledTaskRow

ScheduledTaskRow对应scheduled_tasks表。

一行代表一个定时任务。

字段如下。

id是主键。

user_id是属主。

user_id有索引。

thread_id是绑定的会话。

可为空。

context_mode是上下文模式。

默认fresh_thread_per_run。

每次分发用新thread。

assistant_id是哪个agent。

title是任务标题。

prompt是提示词。

schedule_type是调度类型。

schedule_spec是调度规格JSON。

timezone是时区。

status是任务状态。

默认enabled。

status有索引。

overlap_policy是重叠策略。

默认enqueue。

busy的发生排队而不是跳过。

next_run_at是下次运行时间。

next_run_at有索引。

last_run_at、last_run_id、last_thread_id是上次执行信息。

last_error是上次错误。

lease_owner和lease_expires_at是分发租约。

run_count是运行次数。

last_occurrence_seq是最后发生序号。

created_at和updated_at是时间戳。

（2）ScheduledTaskRunStatus状态词汇

这个StrEnum是发生状态的规范词汇表。

状态有queued、launching、running。

状态有success、failed、skipped、interrupted。

TERMINAL_RUN_STATUSES是四个终态。

ACTIVE_RUN_STATUSES是三个活跃态。

ONCE_TASK_STATUS_BY_RUN_STATUS把发生终态映射到once任务状态。

success映射到completed。

failed映射到failed。

interrupted和skipped映射到cancelled。

这个映射由完成路径和两个恢复路径共享。

映射不能在它们之间漂移。

（3）sql.py的ScheduledTaskRepository

这个类是任务定义的仓库。

方法如下。

create创建任务。

get按task_id查一个。

get_internal取内部视图。

list_by_user列出某用户的任务。

get_active_run_status取活跃发生状态。

pause_with_queue_cancellation暂停并取消排队发生。

delete_with_queue_cancellation删除并取消排队发生。

update更新任务定义。

delete删除任务。

claim_due_tasks认领到期任务。

认领带租约。

release_dispatch_lease释放分发租约。

release_queued_admission_lease释放排队准入租约。

update_after_launch在启动后更新。

complete_run完成任务发生。

claim_dispatch_lease认领分发租约。

list_by_user_and_thread按用户和thread列任务。

cancel_stuck_once_tasks取消卡住的once任务。

reconcile_stuck_once_tasks对账卡住的once任务。

异常类是ActiveScheduledTaskMutationConflict。

有活跃发生时修改任务会冲突。

## 三、它和谁协作

Gateway的deps.py构造这个仓库。

Gateway的scheduled_tasks路由用它服务HTTP请求。

scheduled_task_runs包和它协作。

锁顺序是先父任务后发生记录。

后台调度器认领到期任务。

数据库表由持久层的Alembic引导创建。

migration 0003建了这张表。

## 四、重要性评级

评级：6分。

理由：

定时任务定义是调度功能的配置数据。

任务定义丢了调度就失效。

pause、delete和活跃发生的一致性靠这个包的锁纪律。

但定时任务是可选功能。

需要显式开启scheduler.enabled。

不用定时任务的部署完全不碰这张表。

所以这个包是6分。
