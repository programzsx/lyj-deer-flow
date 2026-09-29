# SchedulerConfig档案

一、这个类是干什么的

SchedulerConfig是定时任务调度器的配置类。调度器在后台轮询。调度器负责一次性任务、cron任务和间隔任务。这个类控制调度器要不要启动。这个类还控制并发、租约和队列行为。这个类继承自pydantic的BaseModel。

二、类的成员

（一）字段

- enabled：布尔值。默认值是False。这个字段表示调度器是否启动。
- multi_instance：布尔值。默认值是False。这个字段表示是否多实例部署。
- poll_interval_seconds：整数。默认值是5。取值范围是1到300。这个字段是轮询间隔秒数。
- lease_seconds：整数。默认值是120。取值范围是5到3600。这个字段是任务租约时长。
- max_concurrent_runs：整数。默认值是3。取值范围是1到32。这个字段限制并发运行数。
- queue_timeout_seconds：整数。默认值是3600。取值范围是60到604800。这个字段是队列超时秒数。
- min_once_delay_seconds：整数。默认值是60。取值范围是1到86400。这个字段是一次性任务的最小延迟。
- recursion_limit：整数。默认值是1000。最小值是1。这个字段是调度器启动运行的LangGraph递归上限。调度器在分发时读取这个值。默认值和web UI的交互预算一致。超过AppConfig.max_recursion_limit的值会被钳制。

（二）方法

这个类没有自定义方法。所有约束都写在Field里。

三、它和谁协作

AppConfig持有这个类。AppConfig的scheduler字段是这个类的实例。ScheduledTaskService相关代码读取这个实例。recursion_limit会和AppConfig.max_recursion_limit做钳制比较。

四、重要性评级

评级：6分。

理由：定时任务是可选功能。默认关闭。但开启后调度器是后台核心。字段控制了并发和成本。所以重要性中等。
