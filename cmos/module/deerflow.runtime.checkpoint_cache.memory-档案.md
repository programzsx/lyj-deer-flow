# deerflow.runtime.checkpoint_cache.memory-档案

## 一、这个模块是干什么的

这个文件是检查点delta历史缓存的进程本地LRU实现。

它是checkpoint_cache的两个后端之一。另一个是redis.py。

它是同步路径的默认。TUI和嵌入式客户端用它。

核心特点是命中路径上零序列化。

数据直接存Python对象。读的时候不需要反序列化。

## 二、模块里的主要成员

### 1、_copy_entry函数

这个函数做写时复制。

返回一个新字典。writes列表是新的副本。seed共享不复制。

seed永远不会被原地修改。所以共享是安全的。

每个读和写都拿一份拷贝。这样调用方改返回值不会污染缓存里的原始条目。

### 2、MemoryCheckpointHistoryCache类

这个类实现两个协议。CheckpointHistoryCache和SyncCheckpointHistoryCache。

#### （1）初始化

max_entries是容量上限。默认128。负数抛ValueError。

_data是OrderedDict。LRU的存储本体。

_hits、_misses、_evictions是统计计数器。

enabled属性。容量大于0时启用。max_entries=0会统一禁用缓存。这样包装器不需要None检查。

#### （2）get_many读取

批量读。

每个键查一次。未命中计数。命中时移到LRU尾部。计数。返回拷贝。

move_to_end实现LRU的访问顺序更新。

#### （3）set_many写入

批量写。

禁用时直接返回。

每个条目存拷贝。移到尾部。超过容量时从头部淘汰。淘汰计数。

popitem(last=False)淘汰最久未访问的条目。

#### （4）异步方法

aget_many和aset_many直接调用同步版本。进程本地内存不需要真正的异步。

#### （5）delete_thread线程清理

按线程前缀匹配清理。这是生命周期清理。不是失效。

遍历全部键。匹配线程前缀的删掉。

adelete_thread是异步版本。

#### （6）stats和aclose

stats返回统计快照。entries是当前条目数。

aclose清空数据。

## 三、它和谁协作

它实现runtime.checkpoint_cache.base里的两个协议。

它被runtime.checkpoint_cache.provider创建。

它被runtime.checkpointer.cached_saver用作缓存后端。

同步检查点路径在delta模式下用它。

它不依赖任何外部库。只用collections的OrderedDict。

## 四、重要性评级

评级是5分。

理由是这个文件是delta缓存的默认后端。

本地开发、TUI、嵌入式客户端全用它。

写时复制保护了缓存条目不被调用方污染。

LRU淘汰和容量上限防止内存无限增长。

不评高分是因为它是纯性能组件。正确性不依赖它。缓存全miss时系统照常工作，只是慢。
