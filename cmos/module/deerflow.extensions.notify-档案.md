# deerflow.extensions.notify档案

## 一、这个模块是干什么的

这个模块是扩展运行时钩子的fail-open通知助手。

扩展可以注册各种观察器。观察器想看运行时发生的事情。比如一个任务开始了。一个系统模型调用完成了。一次上下文压缩发生了。这个模块负责把这些事件通知给注册的观察器。

通知的核心原则是fail-open。一个观察器坏了。不能影响宿主的运行。失败被记录。通知继续进行。

这个模块处理三类通知。

第一类。任务生命周期通知。`on_task_start`和`on_task_stop`。

第二类。系统模型调用通知。目标评估、记忆提取、标题生成、摘要这些宿主自己的模型调用。

第三类。上下文压缩通知。有损的上下文变换发生时通知。

## 二、模块里的主要成员

### 1、lead_task_id和outcome分类函数

- `lead_task_id(run_id)`，返回lead运行的稳定任务id。就是run_id本身。包括续跑。
- `lead_task_outcome`，从终态保守地分类lead运行。中止是ABORTED。成功是COMPLETED。其他是FAILED。
- `subagent_task_outcome`，从终态保守地分类子代理执行。同样的三分类。

### 2、_host_is_cancelling函数

判断宿主任务自己是否正在被取消。

fail-open必须按失败的来源决定。不能按异常的基类决定。`CancelledError`到达contributor的except有两个原因。第一个原因。宿主任务被取消了。必须传播。第二个原因。contributor自己抛的。比如扩展实现了带取消的内部超时。必须留在本地。

只有第一个原因会递增任务的取消计数。所以用`asyncio.Task.cancelling()`区分。

### 3、_notify_each函数

按顺序通知一批contributor。fail-open。在一个共享的预算内。

- 每个contributor依次调用。有超时预算时检查剩余时间。预算花光了就跳过剩余的contributor。记warning。
- `TimeoutError`区分两种。预算耗尽的。记warning。contributor自己抛的。记异常。
- `CancelledError`只在宿主真正取消时传播。contributor自己抛的被留在本地。
- 其他异常记日志继续。

### 4、_notify_loop机制

Gateway注册一个服务循环到这里。子代理可能跑在隔离的事件循环上。但扩展资源必须在启动它的循环上触碰。

- `set_extension_notify_loop(loop)`，绑定循环。
- `reset_extension_notify_loop()`，宿主关闭或测试时移除绑定。
- `suspend_extension_system_observations()`，awaited钩子还在排空时暂停新的fire-and-forget观察。

`_notify_each_on_extension_loop`处理跨循环分发。当前循环就是注册循环时直接await。不是时用`run_coroutine_threadsafe`分发过去。

### 5、notify_task_start和notify_task_stop

通知任务生命周期。lead运行和子代理都走这里。这两个是awaited的。

### 6、notify_system_model_call和observe_system_model_call

`notify_system_model_call`通知系统模型调用的观察器。观察器拿到的task_store有活任务就用活的。没有就用一个隔离的detached store。

`observe_system_model_call`包装一次系统模型调用。报告三种终态。

- 成功。inline等待通知。
- 失败。inline等待通知。然后原样抛出异常。
- 取消。用非阻塞提交报告。因为重复取消会打断那个await。任何观察器都跑不到。然后原样传播取消。

### 7、dispatch_system_model_observation函数

把同步调用点的观察提交到注册的循环。fire-and-forget。

同步的记忆桥没有循环可以await。这个函数处理这种情况。循环没注册时警告一次并丢弃。提交失败时关闭协程。

### 8、notify_agent_assembled和notify_context_compacted

- `notify_agent_assembled`，把完成的代理组装扇出给观察器。同步的。因为代理构建是同步的。没有循环可以分发。每个观察器的失败被留在本地。
- `notify_context_compacted`，把完成的压缩扇出给观察器。fire-and-forget。压缩点在摘要中间件的钩子里。同步的一半没有循环。异步的一半不能阻塞模型调用回合。所以两边都调用这个同步入口。观察器拿到detached store。

## 三、它和谁协作

这个模块依赖`deerflow.extensions.registry.LoadedExtensions`。它读取快照里的各类观察器和app_store。

这个模块依赖`deerflow_extension_api`的事件类型。TaskInfo、TaskOutcome、SystemModelRequest、SystemModelResult、CompactionEvent。

这个模块被多个钩子调用点调用。运行worker调用notify_task_start和notify_task_stop。系统模型调用点调用observe_system_model_call。摘要中间件调用notify_context_compacted。代理工厂调用notify_agent_assembled。

Gateway调用set_extension_notify_loop注册循环。

## 四、重要性评级

评级是8分。

理由。这个模块是全部运行时钩子通知的枢纽。任务生命周期、系统模型调用、上下文压缩、代理组装都从这里扇出。没有它，扩展就看不到运行时发生的事情。

取消来源的区分设计是这个模块最关键的部分。`CancelledError`的两个来源用取消计数区分。宿主取消传播。扩展自己的取消留在本地。这防止一个扩展把成功的运行变成取消。

fail-open的预算设计也很关键。一个共享的通知预算。花光了跳过剩余的contributor。不让一个慢的扩展拖住宿主。

跨循环分发的设计解决了子代理隔离循环的问题。扩展资源必须在拥有它的循环上触碰。

扣两分的原因。没有扩展注册观察器时这个模块全部短路。它是一个旁路的观察通道。不是主执行路径。
