# deerflow.scheduler-档案

## 一、这个包是干什么的

这个包是定时任务的调度计算器。

定时任务需要知道"下一次什么时候运行"。
计算下一次运行时间是纯数学问题。
不涉及执行。
不涉及存储。
只做时间计算。

这个包提供三种调度类型的计算。

- once。一次性任务。到指定时间运行一次。
- cron。周期任务。按cron表达式重复运行。
- interval。间隔任务。每隔N秒运行一次。

这个包还提供辅助校验。
校验时区。
规范cron表达式。

这个包只有一个文件。
代码量很小。
但它是所有定时任务时间计算的唯一来源。

## 二、包里的主要成员

### （一）模块__init__.py——公共出口

导出三个函数。

- `next_run_at`
- `normalize_cron_expression`
- `validate_timezone`

### （二）模块schedules.py——调度计算

#### 1、validate_timezone函数

这个函数校验时区名。
用`ZoneInfo`尝试解析。
解析失败抛ValueError。
成功原样返回时区名。

#### 2、normalize_cron_expression函数

这个函数规范cron表达式。
cron表达式必须恰好5个字段。
多余空白被剔除。
字段数不对抛ValueError。
返回用单空格连接的规范形式。

#### 3、parse_interval_seconds函数

这个函数解析间隔秒数。
`every_seconds`必须是正整数。
布尔值被拒绝。
布尔是int的子类，所以显式排除。
小于1被拒绝。
非法时抛ValueError。

#### 4、next_run_at函数

这个函数计算下一次运行时间。
它是这个包的核心。

它接受四个参数。
schedule_type是调度类型。
schedule_spec是调度规格字典。
timezone_name是时区。
now是当前时间。

它先校验时区。
naive的now被当作UTC。

once类型的处理分几步。

- 读取run_at。run_at必须是字符串。
- 用`datetime.fromisoformat`解析。
- naive的run_at表示任务声明时区的墙上时间。这和cron的解释一致。
- 统一转换成UTC。
- 转UTC是必须的。next_run_at会被持久化到丢弃时区的列里。SQLite就是这样。非UTC偏移会让生效时间整个偏移。
- 已过时间返回None。

cron类型的处理分几步。

- 规范cron表达式。
- 用时区构造ZoneInfo。
- 把now转成任务时区的本地时间。
- 用`croniter`取下一次触发。
- 结果转回UTC。

interval类型的处理最简单。
当前时间加上间隔秒数。
结果转成UTC。

不支持的类型抛ValueError。

#### 5、常量

`MAX_INTERVAL_SECONDS`是30天。
定义间隔调度的最大间隔。

### （三）设计要点

naive时间的解释有统一约定。
naive时间表示任务声明时区的墙上时间。
once和cron遵守同一个约定。
这个约定避免了两类调度的解释分歧。

UTC规约是统一的。
所有计算结果都转成UTC。
存储层会丢弃时区。
非UTC偏移会偏移生效时间。
所以在计算层就转UTC。

## 三、它和谁协作

上游有四类消费者。

- `app/scheduler/service.py`。后台调度服务。用`next_run_at`推进调度。
- `app/gateway/routers/scheduled_tasks.py`。定时任务路由。用调度计算做cron预览。
- `persistence/scheduled_tasks/sql.py`。任务持久化。用`next_run_at`计算持久化的下次运行时间。
- `persistence/scheduled_task_runs/sql.py`。运行持久化。同样消费计算结果。

外部依赖是`croniter`。
croniter负责cron表达式的下一次触发计算。
DST语义由croniter保持。

它不依赖执行层。
它不触发运行。
它只回答"下次什么时候"。

## 四、重要性评级

评级：6分。

理由如下。

这个包是定时任务功能的时间基座。
没有它，定时任务无法计算触发时间。
约6个文件直接引用这个包。

它不是核心路径。
定时任务是可选功能。
配置`config.yaml`的`scheduler.enabled`开关。
关掉定时任务后这个包完全闲置。

它的实现很小。
一个文件，70多行。
但它是唯一的时间计算来源。
所有消费者都从这里取值。
不在这里重复实现。

删除它，定时任务功能瘫痪。
运行主路径不受影响。
Gateway、智能体、工具都不依赖它。
功能面受损，但不致命。

它的重要性在于一致性。
四种消费者共享同一份计算。
计算规则改变时只改一处。
这让定时行为可预测。
