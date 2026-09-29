# deerflow.subagents.capacity-档案

## 一、这个模块是干什么的

这个模块实现子代理执行的进程级准入控制。

子代理执行是重资源操作。每次执行要建图、调LLM、跑工具。没有准入控制的话。并发子代理会耗尽进程资源。

这个模块提供FIFO异步容量控制器。同一时刻最多跑配置数量的子代理。超出的排队或拒绝。排队的工作不占线程。控制器绑定启动时冻结的配置快照。

## 二、模块里的主要成员

### 1、异常类

SubagentCapacityError是显式准入失败的基类。继承RuntimeError。

SubagentCapacityRejected表示进程队列满或配置为饱和时拒绝。

SubagentCapacityTimeout表示排队执行在截止时间前没拿到slot。

### 2、SubagentCapacitySnapshot数据类

快照记录当前容量状态。有max_running、running、max_queued、queued、admission_policy五个字段。

### 3、SubagentExecutionCapacity类

这是FIFO异步容量控制器。排队的工作不占线程。

内部状态有asyncio.Lock。运行计数。等待者deque。

snapshot方法返回快照。注释解释了一个细节。snapshot从非循环线程读。循环线程在asyncio锁下改waiters deque。跨线程迭代会抛"deque mutated during iteration"。len()原子读大小。原始长度可能数到一个刚超时但还没移除自己的等待者。这只让"容量忙"的答案更保守。不会更宽松。

_acquire方法先在锁下判断。运行数小于上限直接加一。队列满或策略是reject就抛SubagentCapacityRejected。否则创建等待future加入队列。在锁外await等待future。超时或取消时。从队列移除自己。但有一个细节。release刚好在超时触发时转移了slot。future完成了。这个调用者实际拥有那次转移。必须先释放再报超时。

_release_locked方法转移slot。有等待者就转移给队首未完成的。运行计数保持不变。没有等待者就减运行计数。没有所有者就抛错。

_release_cancellation_safe方法在重复取消下安全释放。释放任务被shield保护。取消被记下。释放完成后重新抛出取消。这样已获取的slot不会因为重复取消而泄漏。

slot方法是async上下文管理器。获取、yield、在finally里安全释放。

### 4、进程级单例管理

模块维护一个进程级控制器。

configure_subagent_execution_capacity安装启动快照。Gateway启动和嵌入式客户端可能初始化同一个进程。安装相同的冻结启动配置视为空操作。防止入口点重置活着的队列。控制器活着且有执行时禁止重配置。

get_subagent_execution_capacity返回绑定当前执行循环的控制器。控制器为None时创建。控制器绑定别的循环时。空闲就重新绑定。有执行就抛错。生产同步和后台路径共享持久隔离循环。直接异步消费者可能在上一个空闲循环关闭后合法用新循环。

configured_subagent_max_running返回启动快照。不需要事件循环。

## 三、它和谁协作

executor的_aexecute用capacity.slot()包裹执行。容量错误转成admission_failure。

SubagentRuntime持有一个自己的控制器。直接图工厂共享它。

batch_service的执行容量可以显式传入。

它依赖config.subagent_runtime_config的SubagentRuntimeConfig。

## 四、重要性评级

评级是6分（满分10分）。

理由：

准入控制保护进程不被并发子代理压垮。默认3个并发。队列有界。饱和时拒绝。这是资源保护的基础设施。

取消安全的释放设计很细。重复取消下释放不被打断。超时和释放竞争的slot转移处理了。

跨循环重建只允许在完全空闲时。防止控制器搬家打断执行。

它逻辑量中等。属于基础设施。给6分。
