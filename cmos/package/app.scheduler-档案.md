# app.scheduler包档案

源码路径是backend/app/scheduler/__init__.py。

## 一、这个包是干什么的

这个包是定时任务的后台调度服务。

用户可以创建定时任务。

定时任务按cron或间隔表达式在未来反复运行。

谁来触发这些任务。

答案是后台调度器。

调度器是ScheduledTaskService。

调度器作为后台任务运行在Gateway进程里。

调度器定期扫描到期任务。

到期任务被派发到Gateway的正常运行路径。

调度行为由config.yaml的scheduler键控制。

scheduler.enabled打开调度器。

调度器默认单实例。

scheduler.multi_instance=true启用多实例租约感知恢复。

多实例需要共享Postgres、心跳开启、数据库事件后端。

否则启动直接拒绝配置。

## 二、包里的主要成员

### 1、__init__.py

__init__.py导出ScheduledTaskService。

从.service导入。

### 2、service.py

service.py是包的主体。

service.py有630多行。

ScheduledTaskService类的构造参数包含task_repo、task_run_repo、launch_run、poll_interval_seconds、lease_seconds、max_concurrent_runs、queue_timeout_seconds、multi_instance、run_lease_grace_seconds。

_lease_owner是租约拥有者标识。

标识格式是主机名加随机UUID。

关键方法如下。

- run_once执行一轮扫描。多实例时先做租约恢复。
- dispatch_task派发任务。派发包括准入、排队、启动。
- _attempt_queued_run尝试排队中的运行。
- _launch_queued_occurrence启动排队的出现次数。启动用租约围栏。只有租约围栏内的launching状态才能调用Gateway启动。
- _record_launched_run记录已启动的运行。
- _drain_queue排空队列。原子队列认领强制max_concurrent_runs。
- _expire_waiting_runs使过期的等待运行失效。
- handle_run_completion处理运行完成。完成后推进到下一次调度。
- start启动后台轮询任务。
- stop优雅停止。
- _run_loop是轮询循环。
- _reconcile_active_state做活动状态恢复。

状态机如下。

排队的出现次数持久化为queued。

queued行在重启后存活。

launching是短租约围栏的认领。

running引用持久运行。

排队超时用queue_timeout_seconds限制持久等待。

繁忙的出现次数排队而不是跳过。

每个任务只允许一个活动出现次数。

数据库有唯一约束uq_scheduled_task_run_active约束这个不变量。

约束条件是status在queued、launching、running里。

重复触发会合并。

同线程FIFO排在旧活动行后面。

暂停和删除原子地取消queued工作。

但拒绝launching和running。

启动恢复把过期的启动认领放回持久队列。

把过期的运行租约原子接管。

多实例下Postgres advisory锁让max_concurrent_runs成为launching和running行的共享全局上限。

## 三、它和谁协作

上游是routers/scheduled_tasks.py。

路由用deps.py的get_scheduled_task_service调用服务。

下游是Gateway运行路径。

服务通过launch_run闭包启动定时线程运行。

launch_run闭包在app.py的lifespan里创建。

服务依赖deerflow.persistence.scheduled_tasks的持久化。

服务依赖deerflow.scheduler.schedules的next_run_at计算下次运行时间。

服务依赖deerflow.runtime的ConflictError和RunRecord。

调度器被ChannelManager引用。

渠道派发的定时任务经过调度服务。

## 重要性评级

评级是6分。

理由如下。

定时任务是产品的一个可选功能。

功能由config.yaml的scheduler.enabled控制。

调度器关闭时，所有定时任务功能停用。

但聊天、运行、渠道等核心功能完全不受影响。

调度器实现了很多分布式正确性细节。

租约围栏、原子队列认领、唯一约束、advisory锁、启动恢复。

这些细节保证多实例部署下任务不重复、不丢失。

删除这个包，定时任务不能自动触发。

用户手动触发仍然可用。

所以评级是6分。

这个包被app.py、deps.py、routers/scheduled_tasks.py引用。

不在所有请求的核心路径上。
