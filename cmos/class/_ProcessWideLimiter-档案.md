# _ProcessWideLimiter档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/llm_error_handling_middleware.py`

## 一、这个类是干什么的

_ProcessWideLimiter是一个跨事件循环、跨同步异步的并发限制器。

问题来自asyncio.Semaphore的局限。
asyncio.Semaphore绑定到第一次使用它的事件循环。
从别的循环再去获取会直接报错。

DeerFlow里lead agent和subagent跑在不同的循环上。
同步图路径又是另一条路。
一个asyncio.Semaphore管不住所有这些路径。

所以这个限制器改用threading原语实现。
所有调用路径共享同一个在飞计数器和同一个上限。

上限是不可变的。
上限在第一个中间件构造时定死。
之后绝不修改。
这样就没有缩容竞态。也没有配置过期竞态。

## 二、类的成员

### （一）字段

限制器内部维护锁、在飞计数、空闲计数、同步等待队列和异步等待队列。

### （二）方法

- `limit`（property）：返回上限。
- `in_flight`（property）：返回当前在飞的调用数。
- `acquire_sync`：同步获取一个许可。没有就阻塞线程。
- `acquire_async`：异步获取一个许可。有空闲直接拿。没有就登记成_AsyncWaiter睡觉，不阻塞事件循环。被取消时如果许可已经保留给它，就把许可移交给下一个等待者。
- `release`：归还一个许可。如果有异步等待者排队，许可直接转移给它，所有权移动，在飞数不变。否则许可回到空闲池，并唤醒一个同步等待者。
- `_try_acquire_locked`：持锁时的快速尝试。
- `_handoff_granted_permit_locked`：把已经保留的许可移交给下一个等待者，或释放回池子。保证许可永不丢失。
- `_wake_locked`：在等待者的循环上调度唤醒。循环死了就返回False。

## 三、它和谁协作

- LLMErrorHandlingMiddleware的`_bounded_model_call_sync`和`_bounded_model_call`使用它。
- 上限由第一个LLMErrorHandlingMiddleware实例的`_apply_configured_cap`设定。
- 它同时约束lead agent、subagent和同步图路径的模型调用。

## 四、重要性评级

评级：8/10。

理由：它是全进程LLM并发控制的地基。没有它，限流配置在多循环下会直接失效。它的移交逻辑保证了容量不泄漏。它是一个内部类，行为全部服务于一个中间件。所以不给9分以上。