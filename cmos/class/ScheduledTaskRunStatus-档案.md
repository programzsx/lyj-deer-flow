# ScheduledTaskRunStatus-档案

## 一、这个类是干什么的

ScheduledTaskRunStatus是persistence/scheduled_tasks/model.py里的枚举。

它是StrEnum。

它是scheduled-task occurrence的规范状态词汇。

这个类位于backend/packages/harness/deerflow/persistence/scheduled_tasks/model.py。

## 二、类的成员（枚举值，各自做什么）

### 1、活跃状态

QUEUED是queued。durable的等待行。

LAUNCHING是launching。短lease-fenced claim。只有它可以调Gateway launch。

RUNNING是running。引用durable run。

### 2、终态

SUCCESS是成功。

FAILED是失败。

SKIPPED是跳过。

INTERRUPTED是中断。

### 3、状态词汇共享

它是共享的API和repository词汇。

必须匹配活跃和终态occurrence状态集。

run-history的status过滤是occurrence状态。不是task状态。

### 4、活跃唯一约束

uq_scheduled_task_run_active约束task_id WHERE status IN (queued、launching、running)。

每个task一个活跃occurrence。

## 三、它和谁协作

- ScheduledTaskRunRepository和ScheduledTaskRepository使用它。
- scheduler服务读写它。
- API响应使用它。

## 四、重要性评级

评级是5分。

理由如下。

这个枚举是scheduled-task occurrence的规范状态词汇。

活跃和终态七值。

共享API和repository词汇。

活跃状态支撑唯一约束。

queued是durable的。survive重启。

launching是lease-fenced的。

这些是调度状态机的核心。

扣掉5分。

扣分原因是它是枚举词汇。逻辑在repository里。
