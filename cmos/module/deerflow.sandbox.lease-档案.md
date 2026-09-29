# deerflow.sandbox.lease档案

## 一、这个模块是干什么的

这个模块做执行范围的租约。管理进程内的沙箱使用。

provider的所有权存储回答一个问题。哪个Gateway实例可以回收一个远程沙箱。这个模块回答另一个问题。一个Gateway里并发的Agent执行中。哪些还在用provider的活动客户端。最后一个执行租约是唯一被允许调用`SandboxProvider.release`的。

这个模块解决的核心问题是并发共享。

一个沙箱可能同时被lead运行、子代理、Gateway请求、渠道上传使用。任何一方单独释放会把别人的沙箱停掉。租约管理器跟踪每个沙箱有多少个执行持有者。最后一个持有者释放时才真正释放provider的沙箱。

## 二、模块里的主要成员

### 1、SandboxLeaseManager类

这是租约管理器本体。

内部结构有下面这些。

- `_bindings_by_owner`，owner id到租约绑定的映射。
- `_owners_by_sandbox`，沙箱id到owner id集合的映射。
- `_release_pending_by_sandbox`，有挂起释放请求的沙箱集合。
- `_serializer`，一个AcquireSerializer。按（user_id, thread_id）键串行化生命周期转换。
- `_metadata_lock`，元数据锁。保护映射结构。

主要方法有下面这些。

- `acquire(owner_id, thread_id, user_id)`，获取并绑定一个沙箱。对一个执行owner幂等。先看owner有没有活的绑定。有就复用。没有就acquire并绑定。
- `reuse_or_acquire(owner_id, sandbox_id, ...)`，原子地恢复一个范围绑定的沙箱或获取替代品。普通checkpoint id必须匹配user_id和thread_id。服务器创建的fork包装可以借父客户端。借不到时替代品正常拥有。
- `retain(owner_id, sandbox_id, ...)`，把一个执行附加到继承的或checkpoint的沙箱id上。
- `release(owner_id)`，释放一个执行。最后一个持有者释放时才park沙箱。
- `binding_for(owner_id)`，诊断和测试用。

元数据锁和串行化器分离。无关线程不互相阻塞对方的慢provider操作。

### 2、release_on_last的语义

绑定时可以指定release_on_last。

- True是普通owner。最后一个持有者离开时请求park沙箱。
- False是借用者。上传同步用它。借用者隔离客户端。拥有命令作用域清理。但自己不请求park。

普通owner可以升级成请求释放。借用者后来做正常获取时升级。

### 3、SandboxClientLease类

一个有界的调用者在进程内对沙箱客户端的持有。

- `sandbox`，沙箱对象。
- `sandbox_id`，沙箱id。
- `owner_id`，租约的owner id。
- `release()`，在最终沙箱操作排空后丢弃这个持有者。
- `run_sync(func)`，在这个租约边界里跑一个阻塞的客户端操作。

### 4、acquire_sandbox_client_lease函数

获取一个唯一的持有者并解析它的进程内客户端。这是Gateway请求租约的非HTTP对应物。调用者必须把返回的对象保持到最后一个沙箱操作。在finally里释放。

### 5、run_sync_lifecycle_operation和_drain_task_after_cancellation

`run_sync_lifecycle_operation`跑阻塞的客户端工作。不允许取消比工作活得更久。`asyncio.to_thread`不能在等待任务取消时停掉工作线程。沙箱清理必须等工作线程结束后外层围栏才能释放客户端持有。重复取消被记住。在工作线程结束后才传播。

`_drain_task_after_cancellation`等待任务完成。即使当前任务再次被取消。生命周期协调必须保持串行化器直到provider工作结束。

### 6、租约管理器的进程注册表

`get_sandbox_lease_manager(provider)`返回一个provider对象的进程内租约管理器。

按`id(provider)`注册。provider实现不要求可哈希。不同实例比较相等也不能共享生命周期状态。强引用条目保持到provider显式分离。

`discard_sandbox_lease_manager(provider)`在provider单例分离时遗忘租约元数据。

### 7、上下文键辅助函数

- `ensure_sandbox_lease_owner(context)`，在可变运行时上下文里创建一个临时的owner id。已存在就复用。
- `sandbox_lease_owner(context)`，读一个执行owner。不为直接工具调用者创建。
- `sandbox_command_scope(context)`，读子代理执行携带的可选shell会话作用域。
- `release_sandbox_execution_lease(context)`，在外层生命周期围栏释放lead或嵌入式执行的租约。
- `SANDBOX_SERVER_OWNED_CONTEXT_KEYS`，服务端拥有的上下文键集合。Gateway和worker会剥掉调用者提供的值。

## 三、它和谁协作

这个模块依赖`deerflow.sandbox.acquire_serialization.AcquireSerializer`做串行化。

这个模块被`deerflow.sandbox.middleware`调用。中间件在before_agent里ensure owner。在after_agent里释放租约。

这个模块被`deerflow.sandbox.tools`调用。ensure_sandbox_initialized用reuse_or_acquire恢复持久沙箱。

这个模块被`deerflow.sandbox.sandbox_provider`调用。provider单例分离时遗忘租约管理器。

这个模块被Gateway的upload同步调用。upload用release_on_last=False借用。

## 四、重要性评级

评级是9分。

理由。这个模块解决沙箱并发共享的核心问题。一个沙箱同时被lead、子代理、请求、上传使用。任何一方单独释放会停掉别人的沙箱。租约管理器跟踪持有者。最后一个持有者才真正释放。

取消处理的设计是这个模块最关键的部分。重复取消不能打断获取、回滚、释放的协调。也不能让to_thread的工作比它的执行持有者活得更久。失败被记录。原始取消不被替换。

租约语义的设计也很关键。release_on_last区分owner和借用者。所有权对单个执行是单调的。owner不能在不同线程身份之间移动。借用者可以升级。fork恢复的执行可以借父客户端。

进程注册表按id注册的设计让不可哈希的自定义provider也能用。

扣一分的原因。它的复杂性集中在协调逻辑上。它不做实际的沙箱创建。provider做。
