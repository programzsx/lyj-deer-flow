# ScheduledTaskService-档案

## 一、这个类是干什么的

ScheduledTaskService是app/scheduler/service.py里的类。

这个类是计划任务的后台调度服务。

它按计划驱动DeerFlow的定时运行。

核心职责如下。

轮询到期的任务并派发运行。

处理队列准入。

恢复中断的运行。

多实例租约感知。

完成任务时写回终态。

这个类由config.yaml的scheduler.enabled开启。

默认单实例。

multi_instance为true时开启租约感知的跨Gateway实例恢复。

这个类位于backend/app/scheduler/service.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、构造方法

构造方法接受task_repo、task_run_repo、launch_run、轮询间隔、租约秒数、最大并发、队列超时、multi_instance、租约宽限秒。

_lease_owner是主机名加uuid。

它标识这个实例。

### 2、run_once方法

这是一次轮询。

流程如下。

多实例时做活动状态reconcile。单实例时恢复过期的launch声明。

然后使等待中的运行过期。

然后排空队列。

然后claim到期任务。

准入和执行容量是分开的。

到期的 occurrence 即使所有执行槽都忙也会持久化。

claim_due_tasks在数据库锁下应用全局launch预算。

### 3、dispatch_task方法

这个方法派发一个任务。

处理三种结果。

- active run已存在时返回已有结果并释放准入租约。
- ActiveScheduledRunConflict时重读活动run。
- ScheduledTaskAdmissionRejected时区分任务不存在和任务变更。

thread_id处理有细节。

fresh_thread_per_run模式或没有thread_id时生成新uuid。

thread id验证失败的行走正常的失败记账而不是抛错。

原因是在中心化thread id契约之前持久化的行可能持有当时合法但现在不合法的id。

未捕获的ValueError会在手动触发时变成HTTP 500。

在轮询器里会中止claim批次的剩余部分。

任务本身永远不标记last_error。

### 4、_attempt_queued_run方法

这个方法在自己的trace作用域里把一个queued occurrence变成live run。

轮询器是非HTTP入口点。

没有TraceMiddleware绑定过任何东西。

每个occurrence开自己的作用域。

不在整个轮询周期共享一个id。

手动触发到达Gateway请求内部。保持那个请求的trace。

### 5、_launch_queued_occurrence方法

这个方法claim并启动。

启动后的记账失败保留非终态槽。

后续轮询不能启动同一个occurrence两次。

launch成功后的处理分几种。

- post-launch记账失败时run仍然活着。任务run行保持running。继续持有任务的单个活动槽。防止下次派发重复启动。这些写入是尽力而为。
- last_error清空。记账异常是基础设施级瞬态，不是运行级失败。任务列表不在正在运行的任务上显示错误。
- launch本身失败时fail_launching_run释放活动槽。
- 重叠冲突时requeue_claimed_run把声明放回队列。

### 6、_task_status_for_launch和_task_status_for_failure

once任务的launch状态是running。不是completed。

在launch时声明completed会在run失败或进程死亡时卡住。

失败时手动触发不消耗任务的计划未来。once任务run_at还在前面时不能翻成failed。

### 7、handle_run_completion方法

这个方法在运行完成时写回终态。

从run metadata提取scheduled_task_id和scheduled_task_run_id。

终态映射如下。

success映射到success。

interrupted映射到interrupted。它和failed不同。中断（用户取消、同线程接管）不带错误也不是执行失败。

error和timeout映射到failed。

### 8、start方法

这个方法启动服务。

单实例时做破坏性清扫。

把stale活动运行标记为interrupted。

reconcile卡住的once任务。

清扫只在Gateway lifespan等待start()时安全。

此时没有请求或轮询准入能创建本进程拥有的运行。

multi_instance时做租约reconcile。

### 9、_run_loop方法

这是轮询循环。

轮询失败打日志重试下一个间隔。

SQLite的database is locked这类瞬态错误不能杀死轮询任务。

### 10、_drain_queue方法

这个方法排空队列。

排队时任务被删除的标记interrupted。

排队时任务被暂停的标记interrupted。

但手动触发是显式请求。允许不恢复计划就运行。

后续的pause会在pause_with_queue_cancellation里原子取消已排队的手动行。

## 三、它和谁协作

- persistence/scheduled_tasks和scheduled_task_runs的repository。
- launch_run回调查询Gateway运行路径。
- deerflow.scheduler.schedules的next_run_at计算下次运行。
- trace_context的ensure_trace_context绑定trace。
- persistence的ActiveScheduledRunConflict等异常。

## 四、重要性评级

评级是9分。

理由如下。

这个类是计划任务系统的核心。

它处理了大量的分布式边界。

租约感知恢复、队列准入、launch声明、启动清扫、终态写回。

每个失败路径都有明确的状态保留策略。

启动清扫的时机被严格限定。

瞬态数据库错误不杀轮询任务。

once任务的completed不能提前声明。

这些细节都是多实例正确性的关键。

扣掉1分。

扣分原因是单实例模式下部分逻辑简化。
