# CheckpointHistoryCache-档案

## 一、这个类是干什么的

CheckpointHistoryCache是runtime/checkpoint_cache/base.py里的Protocol。

它是checkpoint delta历史条目的缓存后端契约。

条目是DeltaChannelHistory形状的字典。

按不可变的(database, thread, namespace, checkpoint_id, channel)元组做键。

checkpoint lineage是追加式的。

一个checkpoint的历史排除自己的pending writes。

条目写入后永不变化。

正确性从不需要失效。

共享后端跨进程一致，不需要任何协调。

唯一的删除API是线程级的。

它纯粹为数据生命周期存在，不为正确性。

源checkpoint被删除时（线程删除、租户注销、GDPR式擦除），该线程的缓存历史载荷也必须删掉。

而不是留到LRU淘汰或TTL过期。

这个契约位于backend/packages/harness/deerflow/runtime/checkpoint_cache/base.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、CheckpointHistoryCache异步协议

- aget_many按键列表取回条目字典。
- aset_many写入条目字典。
- adelete_thread删除一个线程的所有历史键。
- stats返回CheckpointCacheStats。
- aclose关闭。

### 2、SyncCheckpointHistoryCache同步协议

同步后端契约。内嵌和TUI路径用。只有memory后端。

- get_many、set_many、delete_thread、stats。

### 3、make_history_key函数

这个模块级函数构建防碰撞的缓存键。

thread_id保持可读。运维调试方便。

其余组件用NUL分隔符哈希。

包含冒号的命名空间不能产生歧义键。

哈希是sha256前24字符。

### 4、thread_key_stem函数

这个函数返回匹配一个线程所有历史键的前缀。

### 5、CheckpointCacheStats数据类

- hits、misses、evictions、entries四个计数。

as_dict方法转成字典。

### 6、CACHE_FORMAT_VERSION

缓存格式版本。当前是1。

## 三、它和谁协作

- CachedHistorySaver是主要消费者。
- MemoryCheckpointHistoryCache和RedisCheckpointHistoryCache是两个实现。
- 线程删除路径调用adelete_thread。

## 四、重要性评级

评级是6分。

理由如下。

这个契约是checkpoint缓存的统一接口。

它明确缓存是性能优化。

删除是数据生命周期不是正确性。

不可变键让共享后端不需要协调。

make_history_key处理命名空间冒号歧义。

但它是接口定义。

逻辑在实现里。

扣掉4分。
