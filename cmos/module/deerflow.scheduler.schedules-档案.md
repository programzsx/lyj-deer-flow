# deerflow.scheduler.schedules

## 一、这个模块是干什么的

这个模块做定时任务的时间计算。

背景是这样的。

系统支持定时任务。

定时任务有三种排期方式。

方式一是once，跑一次。

方式二是cron，按cron表达式周期跑。

方式三是interval，按固定间隔跑。

这个模块负责计算下一次运行时间。

它还负责校验时区和cron表达式。

时区处理是重点。

cron按任务声明的时区解释。

计算出的时间统一归一到UTC。

因为时间会持久化到丢弃时区信息的数据库列里。

SQLite就是这种列。

不归一到UTC会让实际触发时间偏移整个时区差。

once类型也有类似规则。

run_at没带时区时按任务声明的时区解释。

然后归一到UTC。

过期的once时间返回None。

表示不再触发。

## 二、模块里的主要成员

- next_run_at(schedule_type, schedule_spec, timezone_name, now)：核心函数。按排期类型计算下一次运行时间。返回UTC时间。
- once分支：解析run_at，无时区时按声明时区解释，归一到UTC，过期返回None。
- cron分支：归一化表达式，用croniter在声明时区里算下一次，归一到UTC。
- interval分支：every_seconds加到当前时间上。
- validate_timezone(timezone_name)：校验时区名。未知时区抛ValueError。
- normalize_cron_expression(expr)：归一化cron表达式。必须正好5个字段。
- parse_interval_seconds：解析间隔秒数。必须是正整数。bool不算。
- MAX_INTERVAL_SECONDS：最大间隔，30天。

## 三、它和谁协作

- 它被persistence/scheduled_tasks的SQL层使用。计算出的时间写进持久化行。
- 它被app/scheduler/service.py和Gateway的定时任务路由使用。
- 它被预览cron的接口调用。
- 它依赖croniter库做cron计算。

## 四、重要性评级

评级是5分。

理由是定时任务的触发正确性靠它。

时区归一的规则防住了真实的时间偏移缺陷。

它是纯计算模块，没有IO和并发。

三种排期类型的语义都在这里定义。

但它体量小，逻辑集中。
