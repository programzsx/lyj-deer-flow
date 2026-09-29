# deerflow.runtime.checkpoint_cache-档案

## 一、这个包是干什么的

这个包是DeerFlow的"检查点delta历史缓存"包。

包名是`deerflow.runtime.checkpoint_cache`。源码在`backend/packages/harness/deerflow/runtime/checkpoint_cache/`。

大白话讲。DeerFlow的检查点存储有两种模式。`full`模式存完整快照。`delta`模式用LangGraph的`DeltaChannel`。delta模式下读取一个检查点的完整消息历史。需要沿着祖先链把每一步的写入累加起来。这个累加每次都做会很慢。这个包把累加结果缓存起来。下次直接拿。

这个包只服务于delta模式。full模式用不到它。full检查点自带完整的`channel_values`。

一个关键的正确性论证写在`base.py`的docstring里。检查点的delta历史是它已封存的祖先链的纯函数。LangGraph契约排除目标自己的pending writes。父链接在创建时就固定了。祖先的写入在它的子检查点存在后就封存了。所以缓存条目一旦写入就永远不会变。正确性永远不需要失效。共享后端跨进程不需要任何协调。

## 二、包里的主要成员

### 1、__init__.py

它从`base`和`memory`重新导出公开符号。包括`CACHE_FORMAT_VERSION`、`CheckpointCacheStats`、`CheckpointHistoryCache`、`SyncCheckpointHistoryCache`、`MemoryCheckpointHistoryCache`、`make_history_key`。

### 2、base.py（契约）

这个模块定义缓存后端契约。

- `CheckpointHistoryCache`。异步后端协议。五个方法。`aget_many()`、`aset_many()`、`adelete_thread()`、`stats()`、`aclose()`。
- `SyncCheckpointHistoryCache`。同步后端协议。给嵌入式和TUI路径用。只有memory后端支持同步路径。
- `CheckpointCacheStats`。命中、未命中、驱逐、条目数的统计。
- `make_history_key()`。构建防碰撞的缓存键。`thread_id`保持可读。方便运维调试。其余组件用NUL分隔后做SHA-256。取前24个十六进制字符。这样包含`:`的命名空间不会产生歧义键。
- `thread_key_stem()`。匹配一个线程全部历史键的前缀。
- `CACHE_FORMAT_VERSION`。缓存格式版本。当前是1。它进入默认键前缀。格式变了旧缓存自动失效。

一个重要的设计约束写在docstring里。唯一的删除API是线程范围的（`adelete_thread`）。它纯粹是数据生命周期用途。不是正确性用途。当源检查点被删除（线程删除、租户注销、GDPR式擦除）时。这个线程的缓存载荷必须一起删。不能赖到LRU驱逐或TTL过期。

### 3、memory.py（进程内LRU后端）

`MemoryCheckpointHistoryCache`类。进程本地的LRU缓存。

- 命中路径零序列化。用`OrderedDict`实现LRU。
- `get_many()`。命中时把key移到末尾。返回条目的副本。`_copy_entry()`做写时复制。writes列表复制。seed共享。因为seed永远不会被原地修改。
- `set_many()`。写入并驱逐。超过`max_entries`就从最老的开始弹出。
- `max_entries == 0`时禁用。`enabled`属性反映这个状态。
- `delete_thread()`。按线程前缀清除。
- `aclose()`。清空数据。

### 4、provider.py（缓存工厂）

这个模块是缓存工厂。仿照`make_stream_bridge`的模式。config到env回退到memory。

- `make_checkpoint_cache()`。异步上下文管理器。按配置产出缓存。`type == "memory"`或`max_entries == 0`或无配置时产出memory后端。`type == "redis"`时懒加载redis后端。其他类型抛`ValueError`。退出时用`await_drained`排空`aclose()`。
- `checkpoint_cache_key_prefix()`。构建键前缀。默认形状是`ckpt-hist:v{版本}:{数据库哈希}`。
- `checkpoint_cache_db_hash()`。部署身份哈希。让共享一个Redis的两个部署不碰撞。
- `_stable_postgres_identity()`。免凭证的数据库身份。只用host、端口、库名。不用原始URL。因为对原始URL做哈希会让每次凭证轮换都换缓存命名空间。冷缓存加孤儿键。即使数据库和缓存的检查点历史完全没变。解析不了的URL回退到原始字符串。

Redis地址解析顺序。`config.redis_url`。然后环境变量`DEER_FLOW_CHECKPOINT_CACHE_REDIS_URL`。然后`REDIS_URL`。最后默认`redis://localhost:6379/0`。

### 5、redis.py（共享Redis后端）

`RedisCheckpointHistoryCache`类。多worker共享的Redis后端。

- 条目不可变。所以共享缓存不需要失效。TTL只是泄漏保险网。
- `ttl_seconds == 0`是显式不设过期。不是默认值。此时孤儿键只靠redis的maxmemory。
- 存储格式。serde的类型标签加NUL分隔加载荷。读取时拆开。
- `aget_many()`。用`mget`批量取。Redis故障降级为全未命中。只损失性能，不损失可用性。
- `aset_many()`。用非事务pipeline批量写。写失败只记日志。下次读取重新计算历史。
- `adelete_thread()`。SCAN加UNLINK。失败降级为TTL范围内的残留保留。源头的删除已经发生。所以这里永不抛错。
- redis导入是懒的。这个模块不装可选的`redis` extra也能导入。仿照`runtime/stream_bridge/redis.py`。

## 三、它和谁协作

### 1、上游

- `deerflow.config.database_config`和`AppConfig`。提供`checkpoint_cache`配置节。包括`type`、`max_entries`、`ttl_seconds`、`key_prefix`。
- `deerflow.runtime.checkpointer`。两个工厂（`async_provider.make_checkpointer`和`provider._wrap_sync_if_delta`）在delta模式下把原始saver包进`CachedHistorySaver`。缓存的寿命等于工厂上下文管理器的寿命。
- `deerflow.runtime.checkpointer.cached_saver`。读写缓存的主要消费者。它调用`aget_many`/`aset_many`/`adelete_thread`。
- `deerflow.utils.file_io`。`await_drained`用于排空关闭。

### 2、下游（被谁用）

全仓库搜索`checkpoint_cache`的引用。除本包和runtime目录内部外。引用它的文件包括。

- `backend/packages/harness/deerflow/config/database_config.py`。配置定义。
- `backend/packages/harness/deerflow/runtime/checkpointer/`下的三个文件。消费方。
- `backend/scripts/benchmark/checkpoint/bench_channels.py`。基准测试。
- `backend/tests/`下的六个测试文件。`test_cached_history_saver.py`、`test_cached_history_saver_integration.py`、`test_checkpoint_cache_config.py`、`test_checkpoint_cache_memory.py`、`test_checkpoint_cache_provider.py`、`test_checkpoint_cache_redis.py`、`test_runtime_provider_close_cancellation.py`。

### 3、依赖方向

这个包属于harness层。它只导入`deerflow.config`、runtime兄弟模块和`deerflow.utils`。不导入app层。redis是懒加载的可选依赖。

## 四、重要性评级

评级是5分。

理由如下。

这个包是性能优化组件。不是正确性组件。它的全部价值是让delta模式下检查点历史读取变快。

它被引用的地方少。全仓库除runtime内部和测试外。只有配置定义和一个基准脚本引用它。直接导入引用（`from deerflow.runtime.checkpoint_cache`）有11处。几乎全部来自checkpointer包和测试。

它只在delta模式启用。默认配置是full模式。full模式下这个包完全不参与运行。而且它只在有持久化检查点的部署里被用到。memory检查点加full模式的默认开发环境碰不到它。

删除它会怎样。功能不变。delta模式下的检查点历史读取每次都要沿祖先链重新累加。长线程的读取和序列化成本会明显变慢。`checkpointer`包的工厂需要同步删除对它的调用。其余一切照旧。

为什么是5分不是更低分。它有一个严格论证的正确性设计（不可变条目、免失效、防碰撞键、免凭证身份哈希）。它是delta模式生产部署的关键性能路径。删掉它delta模式在大线程上的表现会退化到难以接受。

为什么不是更高分。它不是核心路径。默认模式不参与运行。缓存失效只会造成性能退化。不会造成数据错误。它的存在是可选的优化。
