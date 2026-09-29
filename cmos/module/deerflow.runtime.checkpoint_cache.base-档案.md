# deerflow.runtime.checkpoint_cache.base-档案

## 一、这个模块是干什么的

这个文件是检查点delta历史条目的缓存后端契约。

它定义了缓存条目的形状、键的构建规则、统计结构、两个后端协议。

它没有具体实现。实现是memory.py和redis.py。

契约的核心论断是这样的。缓存条目是不可变的。

检查点谱系是append-only的。一个检查点的历史不包含它自己的pending writes。所以条目一旦写入就永远不会变。

不可变意味着正确性不需要失效。共享后端跨进程不需要任何协调。

唯一的删除API是线程级的。线程级删除的存在是为了数据生命周期。不是为了正确性。源检查点被删除时，比如线程删除、租户下线、GDPR式擦除，缓存的历史载荷也必须删掉。否则载荷会一直留到LRU淘汰或TTL过期。

## 二、模块里的主要成员

### 1、CACHE_FORMAT_VERSION常量

缓存格式版本号。当前是1。

缓存键前缀里带这个版本。格式变化时版本号隔离新旧键。

### 2、make_history_key函数

这个函数构建防碰撞的缓存键。

输入是键前缀、线程id、命名空间、检查点id、通道。

命名空间、检查点id、通道三个部分用NUL分隔。然后SHA256哈希。取前24个十六进制字符。

线程id保持可读。运维调试方便。

返回前缀:线程id:哈希的格式。

NUL分隔保证含冒号的命名空间不会产生歧义键。

### 3、thread_key_stem函数

这个函数返回匹配一个线程全部历史键的前缀。

格式是前缀:线程id:。

delete_thread用它做前缀匹配清理。

### 4、CheckpointCacheStats数据类

这是缓存统计。

有四个字段。hits命中数。misses未命中数。evictions淘汰数。entries当前条目数。

as_dict方法返回字典形式。

### 5、CheckpointHistoryCache协议

这是异步后端契约。

四个方法。aget_many批量读。aset_many批量写。adelete_thread按线程清理。stats统计。aclose关闭。

### 6、SyncCheckpointHistoryCache协议

这是同步后端契约。嵌入式和TUI路径用。只有memory后端。

方法同名但同步。没有aclose。

## 三、它和谁协作

它被runtime.checkpoint_cache.memory和redis实现。

它被runtime.checkpoint_cache.provider引用。

它被runtime.checkpointer.cached_saver调用。cached_saver用make_history_key和两个协议。

它是纯定义模块。不依赖任何deerflow模块。只用hashlib和dataclasses。

## 四、重要性评级

评级是5分。

理由是这个文件定义了缓存系统的键规则和契约。

键构建规则的正确性保护了不同部署之间不碰撞。

不可变性论断是整个缓存设计的基石。

不评高分是因为它只有定义。逻辑都实现在memory.py、redis.py、cached_saver.py里。
