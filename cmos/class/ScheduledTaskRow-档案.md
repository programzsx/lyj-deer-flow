# ScheduledTaskRow-档案

## 一、这个类是干什么的

ScheduledTaskRow是persistence/scheduled_tasks/model.py里的ORM模型。

这个类是计划任务的持久化行。

scheduled_tasks表。

每个计划任务一行。

它定义任务的计划、状态、租约和最近运行信息。

这个类还定义ScheduledTaskRunStatus。

这是计划任务occurrence的规范状态词汇。

这个类位于backend/packages/harness/deerflow/persistence/scheduled_tasks/model.py。

## 二、类的成员（字段，各自做什么）

### 1、ScheduledTaskRow字段

- id是主键。
- user_id是拥有者。有索引。
- thread_id是关联会话。可为None。fresh_thread_per_run模式不固定线程。
- context_mode默认"fresh_thread_per_run"。表示每次派发新线程。
- assistant_id是代理标识。
- title和prompt是任务内容。
- schedule_type是计划类型。例如cron或once。
- schedule_spec是JSON列的计划细节。
- timezone是时区。
- status是任务状态。默认enabled。有索引。
- overlap_policy是重叠策略。默认enqueue。
- next_run_at是下次运行时间。有索引。
- last_run_at、last_run_id、last_thread_id、last_error是最近运行信息。
- lease_owner和lease_expires_at是派发租约。
- run_count是运行计数。
- last_occurrence_seq是最近occurrence序号。

### 2、ScheduledTaskRunStatus枚举

这是occurrence的规范状态词汇。

- QUEUED是排队。
- LAUNCHING是launch声明中。
- RUNNING是运行中。
- SUCCESS是成功。
- FAILED是失败。
- SKIPPED是跳过。
- INTERRUPTED是中断。

这个枚举是共享的API和repository词汇。

### 3、状态常量

TERMINAL_RUN_STATUSES是终态集合。包括SUCCESS、FAILED、SKIPPED、INTERRUPTED。

ACTIVE_RUN_STATUSES是活动态集合。包括QUEUED、LAUNCHING、RUNNING。

这些常量在scheduled_tasks和scheduled_task_runs之间共享。

避免循环导入并保证一致。

## 三、它和谁协作

- ScheduledTaskRepository读写这个模型。
- ScheduledTaskService轮询时消费next_run_at和租约字段。
- ScheduledTaskRunRow是occurrence行。
- persistence/base的Base提供序列化。

## 四、重要性评级

评级是6分。

理由如下。

这个模型是计划任务的定义行。

ScheduledTaskRunStatus是共享的状态词汇。

它必须和API和repository一致。

TERMINAL和ACTIVE状态集合支撑准入约束。

派发租约支撑多实例。

但它是纯数据模型。

扣掉4分。
