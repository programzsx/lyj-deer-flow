# RedisCheckpointHistoryCache-档案

## 一、这个类是干什么的

RedisCheckpointHistoryCache是runtime/checkpoint_cache/redis.py里的类。

它是checkpoint delta history缓存的共享Redis后端。

条目是不可变的。

所以多worker共享缓存不需要失效。

TTL只是泄漏安全网。

线程作用域purge为数据生命周期存在。

线程的checkpoint被删除时它的缓存history payload立即移除。

不lingering到TTL过期。

redis lazy导入。没有可选redis extra时模块仍可导入。

镜像runtime/stream_bridge/redis.py。

这个类位于backend/packages/harness/deerflow/runtime/checkpoint_cache/redis.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、构造方法

redis_url、serde、ttl_seconds、max_connections。

ttl_seconds为0是显式选择不过期。

没有SETEX。不是默认。

泄漏或孤儿键此时只靠redis maxmemory。

### 2、serde

serde序列化条目。

字节存储。decode_responses为False。

### 3、键结构

键按线程前缀组织。

_TAG_SEPARATOR是NUL字节。

thread_key_stem匹配一个线程的所有键。

### 4、后端共享

条目不可变。

多worker共享缓存无失效需求。

TTL是泄漏安全网。

### 5、provider.py工厂

checkpoint_cache/provider.py是缓存工厂。

镜像make_stream_bridge。

config到env回退到memory。

_resolve_redis_url解析Redis URL。

配置、DEER_FLOW_CHECKPOINT_CACHE_REDIS_URL、REDIS_URL、localhost兜底。

_stable_postgres_identity是无凭证数据库身份。

host、port、database。

哈希原始URL会在每次凭证轮换时改变缓存命名空间。

冷缓存加孤儿键直到TTL。

虽然数据库和每个缓存的checkpoint history未变。

checkpoint_cache_db_hash是部署身份哈希。

两个部署共享一个Redis不碰撞。

## 三、它和谁协作

- CheckpointHistoryCache是契约Protocol。
- CachedHistorySaver消费它。
- provider.py工厂选择后端。
- checkpoint_cache_db_hash提供部署身份。

## 四、重要性评级

评级是5分。

理由如下。

这个类是Redis checkpoint history缓存。

不可变条目意味着无失效。

TTL是泄漏安全网。0是显式选择不。

无凭证数据库身份防凭证轮换冷缓存。

部署身份哈希防碰撞。

这些设计不错。

扣掉5分。

扣分原因是它是可选Redis缓存后端。
