# next_run_at-档案

## 一、这个类是干什么的

next_run_at不是类。

next_run_at是scheduler/schedules.py里的模块级函数。

它计算调度任务的下次运行时间。

支持三种调度类型。

once是单次运行。

cron是cron表达式。

interval是固定间隔。

输出是UTC时间。或None表示不再运行。

这个模块位于backend/packages/harness/deerflow/scheduler/schedules.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、next_run_at函数

流程如下。

先validate_timezone验证时区名。

时区未知时抛ValueError。

naive的now补UTC。

once类型如下。

run_at必须是ISO字符串。

naive的run_at表示任务声明时区的墙上时钟时间。

和cron调度的解释一致。

然后规范到UTC。

next_run_at会持久化到丢弃时区的列。SQLite就是这样。

非UTC偏移会把实际触发时间偏移整个offset。

过去时间返回None。

cron类型如下。

normalize_cron_expression要求恰好5个字段。

本地时间用ZoneInfo转换。

croniter算下一个本地时间。

再规范回UTC。

interval类型如下。

every_seconds必须是正整数。

布尔会被拒绝。

now加间隔。规范到UTC。

不支持的类型抛ValueError。

### 2、辅助函数

validate_timezone用ZoneInfo验证时区。

normalize_cron_expression规整空白。

parse_interval_seconds验证every_seconds。

MAX_INTERVAL_SECONDS是30天上限。

### 3、关键设计决策

naive run_at按任务时区解释。

所有输出规范到UTC。

SQLite丢弃时区信息。

这是持久化正确性的关键。

## 三、它和谁协作

- ScheduledTaskService用它算下次运行时间。
- croniter算cron表达式。
- scheduled_task_runs表持久化next_run_at。
- ScheduledTaskRow和ScheduledTaskRunRow是行模型。

## 四、重要性评级

评级是5分。

理由如下。

这个函数是调度时间的唯一计算点。

时区处理正确。

naive时间按声明时区解释。

全部规范到UTC防SQLite时区丢弃偏移。

once不重复。过去时间返回None。

这些是调度正确性的关键。

扣掉5分。

扣分原因是它是纯计算函数。

逻辑集中且短小。
