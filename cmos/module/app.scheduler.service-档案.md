# app.scheduler.service 档案

## 一、这个模块是干什么的

这个模块是定时任务的后台调度服务。

定时任务是DeerFlow的MVP功能。

用户在web界面上创建定时任务。

任务带cron表达式或一次性时间。

调度服务按时间触发任务。

任务触发走正常的Gateway运行路径。

调度运行是非交互式的。

主导智能体的工具集在非交互模式下排除`ask_clarification`。

调度服务是单实例的。

配置`multi_instance=true`可以多实例。

多实例需要共享Postgres。

多实例还需要租约心跳和数据库事件流。

这个服务的职责有五块。

第一块是到期认领。

第二块是入队和启动。

第三块是队列排水。

第四块是恢复。

第五块是完成回写。

## 二、模块里的主要成员

### 1、ScheduledTaskService类

这个类是模块的核心。

#### （1）构造函数

构造函数接收任务仓库、运行仓库、启动函数、轮询间隔、租约时长、并发上限。

构造函数生成租约owner标识。

标识是主机名加随机uuid。

#### （2）run_once方法

这个方法跑一轮调度周期。

多实例模式先做租约对账。

单实例模式恢复过期的launch认领。

然后让排队超时的运行过期。

然后排水队列。

然后认领到期任务。

对每个认领的任务调`dispatch_task`。

#### （3）dispatch_task方法

这个方法分发一个任务。

先决定执行线程id。

`fresh_thread_per_run`模式每次生成新线程id。

否则复用任务绑定的线程。

线程id校验失败走失败记账。

不抛异常。

异常会让手动触发变HTTP 500。

也会让轮询循环中止。

然后检查活动运行。

有活动运行就复用。

没有就创建queued状态的运行行。

创建走原子准入。

一个任务只允许一个活动occurrence。

这是数据库唯一约束保证的。

然后尝试把queued变成live运行。

#### （4）_launch_queued_occurrence方法

这个方法把一个queued变成live运行。

先原子认领queued行。

认领带全局并发预算。

预算是`max_concurrent_runs`。

预算在数据库锁下应用。

然后调注入的`_launch_run`启动真正的Gateway运行。

成功后回写task-run行状态和父任务的next_run_at。

这里处理了三种失败。

第一种是重叠冲突。

认领的行重新排队。

第二种是启动前的失败。

没有live运行。

安全释放活动槽。

运行行标failed。

第三种是启动成功后的记账失败。

运行是活的。

task-run行保持running。

保持运行槽。

防止下一次分发重复启动。

回写是尽力而为。

数据库还在坏就保持queued。

仍然报告已启动。

#### （5）handle_run_completion方法

这个方法是运行完成的回调。

运行结束时Gateway调用它。

它把运行状态映射成occurrence终态。

success映射为success。

interrupted映射为interrupted。

interrupted和failed有区别。

interrupt是用户取消或同线程接管。

这不是执行失败。

error和timeout映射为failed。

终态写回父任务。

`once`任务写完后不再触发。

#### （6）start方法和恢复

start方法在启动时做恢复。

单实例做破坏性清扫。

把上次进程的中断运行标为interrupted。

还要处理卡住的`once`任务。

`once`任务在launch后停在running。

完成钩子已经死了。

需要补偿到终态。

破坏性清扫只在Gateway lifespan等待start时安全。

此时没有请求或轮询准入。

多实例做租约对账。

不对抗活的peer。

#### （7）_drain_queue方法

这个方法排水队列。

queued的行重新尝试认领启动。

任务已删除的行标interrupted。

任务已暂停的行标interrupted。

手动触发的行例外。

暂停只是抑制自动触发。

手动触发是显式请求。

#### （8）stop方法

stop方法停止轮询循环。

## 三、它和谁协作

### 1、它依赖谁

它依赖`deerflow.persistence.scheduled_task_runs`的仓库。

仓库提供原子准入和认领。

它依赖`deerflow.runtime`的ConflictError和RunRecord。

它依赖`deerflow.scheduler.schedules`的next_run_at计算。

它依赖`deerflow.trace_context`的追踪作用域。

每个occurrence开自己的追踪作用域。

它依赖`deerflow.utils.thread_id`的线程id校验。

它依赖注入的`launch_run`启动Gateway运行。

### 2、谁调用它

Gateway启动时创建并start这个服务。

配置的`scheduler.enabled`控制开关。

API路由的调度任务创建、触发、恢复走它的dispatch。

运行完成钩子调用`handle_run_completion`。

## 四、重要性评级

### 1、评级

8分。

### 2、理由

这个模块是定时任务功能的心脏。

没有它，定时任务只是数据库里的一堆行。

它的状态机设计很完整。

queued、launching、running、success、failed、interrupted各态都有明确的进入和退出条件。

它处理了大量真实竞态。

快速失败的运行和启动记账竞争。

重叠触发的合并。

重启后的中断恢复。

卡住的once任务补偿。

队列超时。

每个都有对应的处理。

它的启动恢复是破坏性的。

破坏性要求只在lifespan等待时安全。

这个前提在注释里写得很清楚。

它是可选功能。

不启用调度时系统不受影响。

逻辑密度高。

状态转换多。

所以评8分。
