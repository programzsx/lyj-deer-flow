# deerflow.runtime.checkpoint_cache.redis-档案

## 一、这个模块是干什么的

这个文件是检查点delta历史缓存的共享Redis实现。

它是checkpoint_cache的两个后端之一。另一个是memory.py。

多worker共享缓存时用它。

条目是不可变的。所以共享缓存不需要失效。

TTL是泄漏安全网。不是正确性机制。

线程级清理adelete_thread是为了数据生命周期。线程的检查点被删除时，缓存载荷立即删掉。不留到TTL过期。

redis的导入是惰性的。模块在没有可选redis extra时也能被导入。这镜像了stream_bridge/redis.py的做法。

## 二、模块里的主要成员

### 1、辅助函数

_create_client创建redis异步客户端。decode_responses是False。因为载荷是二进制的。max_connections可选。

_redis_error惰性导入RedisError。镜像惰性客户端创建。

REDIS_INSTALL是安装提示常量。

_TAG_SEPARATOR是NUL字节的字节串。存储格式用标签和载荷之间加NUL分隔。

### 2、RedisCheckpointHistoryCache类

#### （1）初始化

保存redis_url、serde、TTL。

ttl_seconds是0时是显式退出过期。不用SETEX。泄漏或孤儿键靠redis的maxmemory。不是默认配置。

_hits和_misses是统计计数器。

#### （2）aget_many读取

批量读。用mget。

redis出错时降级为全miss。性能专用的旁路。redis故障只损失命中率。不损失可用性。全miss时cached_saver会重算历史。

命中时把原始值按NUL分隔。前半是类型标签。后半是载荷。用serde的loads_typed反序列化。

#### （3）aset_many写入

批量写。用pipeline。transaction是False。

每个条目用serde的dumps_typed序列化。标签编码后加NUL再加载荷。设置TTL。

写入失败只记警告。下一次读会重算历史。

#### （4）adelete_thread线程清理

用SCAN加UNLINK清理一个线程的全部条目。

SCAN按count=500分批。匹配线程前缀加星号。找到就UNLINK。游标归零时结束。

失败时降级为TTL范围内的残留保留。源真值删除已经发生。这个方法从不抛异常。

#### （5）stats和aclose

stats返回命中和未命中计数。没有条目数。redis里不统计这个。

aclose关闭客户端。

## 三、它和谁协作

它实现runtime.checkpoint_cache.base里的CheckpointHistoryCache协议。

它被runtime.checkpoint_cache.provider创建。配置type是redis时。

它被runtime.checkpointer.cached_saver用作缓存后端。

它依赖serde。serde来自检查点saver。两边用同一个序列化器。

## 四、重要性评级

评级是5分。

理由是这个文件是delta缓存的共享后端。

多worker部署共享缓存时用它。共享缓存避免每个worker重算同样的历史。

失败降级设计保护了可用性。redis故障不影响系统正确性。

不评高分是因为它是纯性能组件。缓存全miss时系统照常工作。redis是不可选依赖。
