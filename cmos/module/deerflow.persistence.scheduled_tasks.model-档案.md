# deerflow.persistence.scheduled_tasks.model-档案

## 一、这个模块是干什么的

这个模块定义定时任务的ORM模型和状态词汇。

模型类叫ScheduledTaskRow。

模型对应数据库里的scheduled_tasks表。

定时任务是用户定义的周期性任务。

任务按cron或间隔调度。

任务到点后触发一次run。

这个模块还定义共享的状态常量。

常量给scheduled_tasks和scheduled_task_runs两个模块用。

共享避免循环导入。

共享保证词汇一致。

## 二、模块里的主要成员

### 1、ScheduledTaskRow类

ScheduledTaskRow继承自Base。

ScheduledTaskRow对应scheduled_tasks表。

表由alembic迁移0003创建。

#### （1）标识字段

id是主键。

user_id是拥有者。

user_id有索引。

thread_id是关联线程。

thread_id有索引。

thread_id可空。

#### （2）任务定义字段

context_mode是上下文模式。

默认fresh_thread_per_run。

每次运行用新线程。

assistant_id是使用的agent。

title是任务标题。

prompt是任务提示词。

Text类型。

#### （3）调度字段

schedule_type是调度类型。

schedule_spec是JSON调度的规格。

timezone是时区。

next_run_at是下次运行时间。

next_run_at有索引。

#### （4）状态字段

status是任务状态。

默认enabled。

status有索引。

任务终态有completed、failed、cancelled三种。

overlap_policy是重叠策略。

默认enqueue。

enqueue表示重叠的运行排队而不是跳过。

#### （5）运行记录字段

last_run_at是上次运行时间。

last_run_id是上次运行id。

last_thread_id是上次线程id。

last_error是上次错误。

run_count是运行次数。

#### （6）租约和序号字段

lease_owner和lease_expires_at是调度租约。

多实例部署靠租约认领。

last_occurrence_seq是每次任务的出现序号高水位标记。

BigInteger类型。

#### （7）时间字段

created_at和updated_at是创建和更新时间。

updated_at带onupdate钩子。

### 2、ScheduledTaskRunStatus枚举

这是定时任务出现状态的规范词汇。

StrEnum类型。

出现是任务的一次执行。

状态有七种。

queued、launching、running是活跃状态。

success、failed、skipped、interrupted是终态。

### 3、TERMINAL_RUN_STATUSES常量

终态集合有四个成员。

成员是success、failed、skipped、interrupted。

### 4、ACTIVE_RUN_STATUSES常量

活跃集合有三个成员。

成员是queued、launching、running。

queued是持久的排队状态。

launching是短租约认领。

running是正常的Gateway运行生命周期。

### 5、ONCE_TASK_STATUS_BY_RUN_STATUS常量

这个映射把终态出现状态投影成once任务的父状态。

success映射completed。

failed映射failed。

interrupted和skipped映射cancelled。

共享给完成路径和两个恢复路径。

映射在共享处定义才不会漂移。

## 三、它和谁协作

### 1、它依赖谁

它依赖deerflow.persistence.base的Base。

### 2、谁依赖它

scheduled_tasks/sql.py用ScheduledTaskRow读写。

scheduled_task_runs/sql.py也导入这些常量。

backend的AGENTS.md说明ScheduledTaskRunStatus是共享的API/repository词汇。

必须和活跃与终态出现集合一致。

调度服务scheduler用它认领到期任务。

## 四、重要性评级

评级是7分。

理由如下。

定时任务的数据结构和状态词汇在这里。

共享状态常量防止两个模块的词汇漂移。

backend的AGENTS.md点名要求这个词汇的一致性。

一次任务状态投影的映射也在这里。

扣分的原因是它是纯模型和常量文件。

没有读写逻辑。

定时任务是可选功能。

需要scheduler.enabled配置。
