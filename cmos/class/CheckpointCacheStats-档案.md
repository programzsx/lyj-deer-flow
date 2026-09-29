# CheckpointCacheStats-档案

## 一、这个类是干什么的

CheckpointCacheStats是runtime/checkpoint_cache/base.py里的数据类。

它持有checkpoint历史缓存的统计计数。

字段是hits、misses、evictions、entries。

这个类位于backend/packages/harness/deerflow/runtime/checkpoint_cache/base.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、字段

hits是缓存命中次数。

misses是缓存未命中次数。

evictions是淘汰次数。

entries是当前条目数。

### 2、as_dict方法

返回四个计数的dict。

给API暴露用。

### 3、CheckpointHistoryCache协议

它是异步后端契约。Protocol。

aget_many、aset_many、adelete_thread、stats、aclose。

删除是thread作用域的生命周期purge。不是失效。

### 4、SyncCheckpointHistoryCache协议

它是同步后端契约。嵌入式和TUI路径。只有memory后端。

方法同名。同步版本。

### 5、stats的关系

MemoryCheckpointHistoryCache和RedisCheckpointHistoryCache都返回CheckpointCacheStats。

## 三、它和谁协作

- MemoryCheckpointHistoryCache和RedisCheckpointHistoryCache返回它。
- CheckpointHistoryCache和SyncCheckpointHistoryCache协议的stats方法返回它。
- API暴露消费as_dict。

## 四、重要性评级

评级是3分。

理由如下。

这个类是缓存统计的载体。

四个计数加as_dict。

它是可观测性的数据源。

扣掉7分。

扣分原因是它是纯计数载体。无逻辑。
