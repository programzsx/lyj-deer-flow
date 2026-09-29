# SyncCheckpointHistoryCache-档案

## 一、这个类是干什么的

SyncCheckpointHistoryCache不是类。

SyncCheckpointHistoryCache是runtime/checkpoint_cache/base.py里的Protocol。

checkpoint_cache是checkpoint delta-history条目的缓存后端契约。

条目是DeltaChannelHistory形状的字典。

键是不可变的(database, thread, namespace, checkpoint_id, channel)元组。

checkpoint lineage是append-only。

一个checkpoint的history排除它自己的pending writes。

条目写入后永不改变。

正确性从不需要失效。

共享后端跨进程一致。无需任何协调。

唯一的删除API是线程作用域的。

它纯粹为数据生命周期存在。不为正确性。

源checkpoint被擦除时线程删除、租户下线、GDPR式擦除。

该线程的缓存history payload也必须走。

不 lingering 到LRU淘汰或TTL过期。

这个模块位于backend/packages/harness/deerflow/runtime/checkpoint_cache/base.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、SyncCheckpointHistoryCache Protocol

它是同步后端契约。嵌入和TUI路径。只有memory后端。

方法如下。

get_many取多条。

set_many写多条。

delete_thread删除一个线程的所有条目。

stats返回统计。

### 2、CheckpointHistoryCache Protocol

它是异步后端契约。删除是线程作用域生命周期purge。

aget_many、aset_many、adelete_thread、stats、aclose。

### 3、make_history_key函数

它构建抗碰撞缓存键。

thread_id保持可读供ops调试。

其余组件用NUL分隔符哈希。

含冒号的namespace不能产生歧义键。

摘要取24位。

### 4、CheckpointCacheStats

hits、misses、evictions、entries。

as_dict序列化。

### 5、MemoryCheckpointHistoryCache

它是进程局部LRU后端。命中路径零序列化。

_copy_entry读时复制。

writes列表新建。seed共享。不原地改。

LRU上限默认128。

max_entries为0时禁用。

get_many命中时move_to_end。

set_many超上限时FIFO淘汰。

delete_thread按前缀purge一个线程。

### 6、redis.py对照

RedisCheckpointHistoryCache是Redis后端。

RedisStreamBridge是stream bridge的Redis后端。

### 7、CheckpointCacheStats覆盖

CheckpointCacheStats由两个后端共享。

## 三、它和谁协作

- CachedHistorySaver消费缓存。
- MemoryCheckpointHistoryCache和RedisCheckpointHistoryCache是后端。
- checkpoint_cache/provider.py选择后端。
- 线程删除时调delete_thread。

## 四、重要性评级

评级是6分。

理由如下。

这个契约是delta history缓存的后端边界。

不可变键意味着无失效协调。

线程作用域删除纯为生命周期。

make_history_key用NUL分隔防歧义。

LRU上限加禁用开关。

这些设计质量不错。

扣掉4分。

扣分原因是它是缓存辅助层。
