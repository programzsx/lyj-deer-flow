# deerflow.community.aio_sandbox.ownership.redis

## 一、这个模块是干什么的

这个模块是Redis的所有权存储。

背景是这样的。

多实例部署时多个Gateway共享沙箱容器。

实例之间需要共享的所有权状态。

进程内的存储跨不了进程。

所以需要Redis。

这个存储就是Redis实现。

所有权是每个沙箱一个键。

键的值编码两样东西。

一样是持有者。

一样是租约状态。

状态前缀是own:或del:。

own:表示负责这个容器。

del:表示正在销毁它。

TTL由持有实例刷新。

状态前缀让销毁窗口安全。

不需要锁。

接管会被del:租约拒绝。

容器不会在销毁认领和容器停止之间被重新拿走。

同步客户端是刻意的。

这个存储由提供者构造和后台线程驱动。

从来不在事件循环上。

redis.asyncio在这里是错的客户端。

每个变更都走Lua脚本。

读写不会被peer打断。

单独的SET NX不够。

它在自己已持有的键上会失败。

Python里的GET后SET会重新打开竞态。

脚本把这些都关掉了。

每次往返都有超时上限。

Redis卡住不会把调用方钉死。

## 二、模块里的主要成员

- RedisOwnershipStore：Redis的所有权存储。实现SandboxOwnershipStore契约。
- supports_cross_process为True。
- take(sandbox_id)：拿走租约。Lua脚本原子执行。
- claim(sandbox_id, for_destroy)：认领租约。
- renew(sandbox_id)：续租。刷新TTL。
- release(sandbox_id)：释放租约。
- owner(sandbox_id)：查当前持有者。
- close()：关闭Redis连接。
- _OWN、_DEL：租约状态前缀。
- redis是可选依赖。配置要求redis但没装时给出明确的安装提示。

## 三、它和谁协作

- 它实现community/aio_sandbox/ownership/base的契约。
- 它被ownership/factory按配置选择。
- 它被aio_sandbox_provider消费。
- 它和Redis服务器通信。

## 四、重要性评级

评级是7分。

理由是它是多实例部署的所有权实现。

没有它，多实例共享容器就不安全。

Lua脚本的原子性设计关闭了竞态。

状态前缀的设计保证销毁窗口安全。

它是真实缺陷4206在多实例下的解法。
