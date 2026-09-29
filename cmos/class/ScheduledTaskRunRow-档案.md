# ScheduledTaskRunRow-档案

## 一、这个类是干什么的

ScheduledTaskRunRow是persistence/scheduled_task_runs/model.py里的ORM模型。

这个类是计划任务occurrence的持久化行。

scheduled_task_runs表。

每次计划任务派发的occurrence一行。

这个行承载occurrence的状态、租约和重试计数。

这个类位于backend/packages/harness/deerflow/persistence/scheduled_task_runs/model.py。

## 二、类的成员（字段，各自做什么）

字段如下。

- id是occurrence主键。
- task_id是父任务。有索引。
- occurrence_seq是occurrence序号。NULL标识旧版历史或没有父任务的直接插入。
- launch_accounted标记launch是否已记账。新occurrence从False开始。NULL保留未知的旧版记账。
- thread_id是执行会话。有索引。
- run_id是持久运行id。可为None。
- scheduled_for是计划时间。
- trigger是触发方式。scheduled或manual。
- status是occurrence状态。有索引。
- error是错误文本。
- lease_owner和lease_expires_at是launch租约。
- attempt_count是尝试计数。
- started_at和finished_at是起止时间。
- created_at是创建时间。

### 表级索引

- uq_scheduled_task_run_occurrence_seq是task加occurrence_seq的唯一索引。
- uq_scheduled_task_run_active是关键索引。每个任务最多一个非终态（queued、launching、running）occurrence。

queued occurrence是故意持久的。

launching是短的租约限定claim。

多个Gateway实例不能launch同一行。

它是runs表的uq_runs_thread_active的兄弟。

那个键在thread_id上。

不覆盖默认的fresh_thread_per_run上下文。

每次派发都得到新线程。

所以计划任务运行行需要自己的守卫。

这个索引必须在ORM的__table_args__里。

不能只在migration里。

原因是空数据库的bootstrap路径运行create_all加stamp head。

从不执行定义这个索引的migration。

## 三、它和谁协作

- ScheduledTaskRunRepository读写这个模型。
- ScheduledTaskServiceclaim和恢复时消费租约字段。
- ScheduledTaskRunStatus是状态词汇。
- persistence/base的Base提供序列化。

## 四、重要性评级

评级是7分。

理由如下。

这个模型是计划任务occurrence的核心行。

uq_scheduled_task_run_active是每任务一个活动occurrence的跨进程保证。

它必须有独立于runs表的守卫。

因为fresh_thread_per_run不共享thread_id。

queued持久、launching租约限定的设计支撑多实例。

它必须在ORM表参数里。

bootstrap路径的原因被明确记录。

但它是纯数据行。

扣掉3分。
