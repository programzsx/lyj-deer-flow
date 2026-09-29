# deerflow.runtime.checkpoint_cache.provider-档案

## 一、这个模块是干什么的

这个文件是检查点历史缓存的工厂。

它把配置解析成缓存实例。模式是config到环境变量回退到memory。

它还负责构建缓存键前缀。

前缀里带部署身份哈希。两个部署共享一个Redis时不会碰撞。

## 二、模块里的主要成员

### 1、_resolve_redis_url

这个函数解析redis地址。

顺序是配置里的redis_url。然后DEER_FLOW_CHECKPOINT_CACHE_REDIS_URL环境变量。然后REDIS_URL环境变量。最后默认redis://localhost:6379/0。

### 2、_stable_postgres_identity

这个函数返回免凭证的数据库身份。格式是host:port/database。

哈希原始URL会在每次凭证轮换时改变缓存命名空间。命名空间变了就是冷缓存加孤儿键直到TTL过期。虽然数据库没变。缓存的历史也没变。

解析不了的URL回退到原始字符串。仍然按部署稳定。

### 3、checkpoint_cache_db_hash

这个函数返回部署身份哈希。

后端是postgres时。身份是postgres加稳定身份加schema。

是sqlite时。身份是sqlite加检查点文件路径。

是memory时。身份就是memory。

SHA256取前12个字符。

### 4、checkpoint_cache_key_prefix

这个函数返回缓存键前缀。

配置里显式指定了key_prefix就用配置的。

否则自动构建。格式是ckpt-hist:v版本号:部署哈希。

版本号来自CACHE_FORMAT_VERSION。部署哈希来自checkpoint_cache_db_hash。

### 5、make_checkpoint_cache

这是工厂的异步上下文管理器。

它接收可选的AppConfig和serde。serde来自检查点saver。两边用同一个序列化器。

决策逻辑是这样的。

配置缺失、type是memory、或max_entries是0时。创建MemoryCheckpointHistoryCache。max_entries=0时统一禁用缓存。包装器不需要None检查。finally里用await_drained关闭缓存。

type是redis时。创建RedisCheckpointHistoryCache。传入redis地址、serde、TTL。finally里关闭。

其他类型抛ValueError。

关闭用await_drained。调用方取消不能打断缓存的关闭。

## 三、它和谁协作

它依赖config里的AppConfig。

它依赖runtime.checkpoint_cache.base里的版本号和协议。

它依赖runtime.checkpoint_cache.memory和redis两个实现。

它依赖deerflow.utils.file_io里的await_drained。

它被runtime.checkpointer.async_provider调用。delta模式下。

它被runtime.checkpointer.provider调用。同步路径上用它的checkpoint_cache_key_prefix。

## 四、重要性评级

评级是4分。

理由是这个文件是缓存的工厂。

它的键前缀设计保护了共享Redis上的多部署隔离。

免凭证身份避免了凭证轮换导致的冷缓存。

不评高分是因为它只是装配逻辑。缓存的核心行为在实现和包装器里。
