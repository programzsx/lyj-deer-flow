# SandboxLeaseManager档案

源码位置：backend/packages/harness/deerflow/sandbox/lease.py

## 一、这个类是干什么的

SandboxLeaseManager是沙箱的进程内租约管理器。

提供者的所有权存储回答的是"哪个Gateway实例可以回收远程沙箱"。这个模块回答的是另一个问题。"一个Gateway里并发运行的Agent执行中，哪些还在用提供者的活跃客户端"。最后一个执行租约是唯一被允许调用SandboxProvider.release的。

SandboxLeaseManager的职责有这些。

第一。协调一个提供者的活跃Agent用户。多个并发执行可以同时使用一个沙箱客户端。租约按owner_id记录。

第二。生命周期转换按用户/线程键串行化。元数据用单独的锁保护。这样不相关的线程不会互相阻塞慢的提供者操作。

第三。释放语义。release_on_last为True的正常持有者离开时，记住关闭请求。fork或upload的借用者还在用客户端。关闭责任属于沙箱生命周期。不是属于碰巧最后结束的持有者。每个沙箱的最后一个持有者离开时才真正release提供者。

第四。恢复语义。reuse_or_acquire原子地恢复作用域沙箱或获取替代品。普通checkpoint id必须匹配user_id和thread_id。服务器创建的fork包装可以借用父的活跃客户端。客户端不在时替代品按正常拥有处理。

第五。取消处理。重复取消不能打断获取/回滚/释放的和解。to_thread的工作不能比它的持有者活得更久。

## 二、类的成员

（一）字段

- _provider：提供者。
- _metadata_lock：元数据锁。RLock。
- _serializer：按线程键串行化的AcquireSerializer。
- _bindings_by_owner：owner_id到绑定信息的映射。
- _owners_by_sandbox：sandbox_id到owner集合的映射。
- _release_pending_by_sandbox：有待释放请求的沙箱集合。

（二）主要方法

- acquire：获取并绑定沙箱。对一个执行所有者幂等。
- acquire_async：异步获取。保留提供者自己的异步hook。
- reuse_or_acquire：原子地恢复作用域沙箱或获取替代品。
- reuse_or_acquire_async：异步对应版本。
- retain：把一个执行附加到继承或checkpoint的沙箱id上。
- retain_async：异步对应版本。
- release：释放一个执行。最后一个用户之后才park沙箱。
- release_async：异步释放。不阻塞调用者的事件循环。
- binding_for：返回owner绑定的沙箱。诊断和测试用。
- close：停止接受新转换。释放serializer workers。

（三）模块级函数

- get_sandbox_lease_manager：按提供者对象身份返回进程内管理器。提供者不要求可哈希。管理器按对象身份记录，不按哈希。
- discard_sandbox_lease_manager：单例分离时忘记租约元数据。
- ensure_sandbox_lease_owner：在可变的运行时上下文里创建一个临时owner id。
- sandbox_lease_owner：读执行owner。不为直接工具调用者创建。
- release_sandbox_execution_lease：在外层生命周期fence释放lead或嵌入式执行租约。

## 三、它和谁协作

（一）使用者

SandboxMiddleware用管理器获取、保留、释放沙箱。上传同步用acquire_sandbox_client_lease。Gateway请求租约是HTTP侧的对应物。

（二）提供者

管理器持有提供者。获取、释放都走提供者。get_scoped用于身份作用域查找。

（三）串行化

管理器用AcquireSerializer按（user_id，thread_id）键串行化生命周期转换。

## 四、重要性评级

评级：9分。

理由：SandboxLeaseManager是沙箱并发使用的核心协调器。它解决了"哪些执行还在用这个沙箱"这个并发问题。最后一个持有者才释放、fork借用、恢复语义、取消处理都是真实并发场景下的正确性设计。没有它，并发的Agent执行会互相驱逐对方的沙箱。给9分。
