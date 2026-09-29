# deerflow.community.aio_sandbox.ownership.memory

## 一、这个模块是干什么的

这个模块是进程内的所有权存储。

背景是这样的。

所有权存储有两种实现。

这个是进程内的那种。

它只在单实例部署时是正确的。

因为进程内的东西别的进程看不见。

别的进程会把每个容器都看成无主。

然后认走它。

所以它明确声明自己不支持跨进程。

提供者在启动时会警告一次。

多worker或多实例的Gateway必须用Redis存储。

这个规则和stream桥的memory后端一样。

它不是桩实现。

TTL和两个租约状态都是真实现。

这样做的好处是一套契约测试可以同时测两种后端。

过期的租约在哪种存储下行为都一致。

它内部用线程锁保护状态。

因为获取路径、空闲检查线程、续租线程都会碰它。

## 二、模块里的主要成员

- MemoryOwnershipStore：进程内的所有权存储。实现SandboxOwnershipStore契约。
- supports_cross_process为False。声明不支持跨进程。
- take(sandbox_id)：拿走租约。
- claim(sandbox_id, for_destroy)：认领租约。
- renew(sandbox_id)：续租。
- release(sandbox_id)：释放租约。
- owner(sandbox_id)：查当前持有者。
- _Lease：租约数据。包含持有者、过期时间、销毁中标记。
- _lock：线程锁。保护租约表。
- time_source可注入。测试用。

## 三、它和谁协作

- 它实现community/aio_sandbox/ownership/base的契约。
- 它被ownership/factory按配置选择。
- 它被aio_sandbox_provider消费。

## 四、重要性评级

评级是4分。

理由是它是单实例部署的所有权实现。

TTL和租约状态是真实现，和Redis共享测试。

supports_cross_process的声明和启动警告防止多实例误用。

但它只在单实例下正确。

多实例必须换Redis。
