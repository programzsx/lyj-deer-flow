# AcquireSerializer档案

源码位置：backend/packages/harness/deerflow/sandbox/acquire_serialization.py

## 一、这个类是干什么的

AcquireSerializer是一个按键串行化的锁表。

AcquireSerializer把选定的获取/释放生命周期转换按key串行化。共享组件给沙箱提供者用。每个提供者选择保持自己冲突和生命周期语义的key。AIO和E2B用（user_id，thread_id）。BoxLite、Tenki、OpenSandbox用派生的沙箱id。serializer从不解释key。

AcquireSerializer的核心是一个有界的、引用计数的per-key锁表。每个key对应一个threading.Lock和引用计数。锁表有界。引用计数归零且锁空闲时表项被移除。

异步路径的设计是这样的。阻塞的threading.Lock.acquire跑在一个有界专用executor上。不用默认executor。不用事件循环。一个小的交接状态让获取worker自己释放被抛弃的锁。清理不依赖正在取消的事件循环跑done回调。

_AsyncAcquire是事件循环和获取worker之间竞态安全的所有权交接。交接状态记录abandoned、acquired、cleaned三种标志。abandon、cancel_queued、release都处理竞态。

run_on_executor在serializer的专用executor上跑阻塞调用。to_thread会自动复制ContextVar。原始的run_in_executor不会。所以这里显式复制调用上下文。没有复制的话，请求级ContextVar（比如trace id）在worker线程里读出来是未设置。

close方法拒绝新持有者并释放executor资源。close是幂等的。正在执行的关键区不失效。关键区退出时仍释放锁并回收表项。

## 二、类的成员

（一）字段

- _table：key到_Entry的锁表。
- _table_lock：锁表的锁。
- _closed：是否已关闭。
- _executor：专用的有界ThreadPoolExecutor。

（二）方法

- hold：同步上下文管理器。按key持有锁。
- hold_async：异步上下文管理器。阻塞的锁获取跑在专用executor上。
- run_on_executor：在专用executor上跑阻塞调用。显式复制ContextVar。
- close：拒绝新持有者。幂等。
- _checkout：从表里取锁表项。引用计数加一。
- _checkin：归还锁表项。引用计数减一。归零且锁空闲时移除表项。

## 三、它和谁协作

（一）使用者

SandboxLeaseManager用它按（user_id，thread_id）键串行化生命周期转换。沙箱提供者（AIO、E2B等）也直接用它串行化获取和释放。

## 四、重要性评级

评级：8分。

理由：AcquireSerializer是沙箱获取串行化的共享基础组件。它解决了取消竞态、锁表泄漏、executor关闭等真实并发问题。_AsyncAcquire的交接状态设计非常精细。没有它，并发的沙箱获取会互相干扰。给8分。
