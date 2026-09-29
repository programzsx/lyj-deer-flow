# CachedHistorySaver-档案

## 一、这个类是干什么的

CachedHistorySaver是runtime/checkpointer/cached_saver.py里的类。

它是任何BaseCheckpointSaver的读透式delta历史缓存包装。

正确性论证如下。

一个checkpoint的delta历史是它封印的祖先链的纯函数。

LangGraph契约排除目标自己的pending writes。

父链接在创建时固定。

祖先的写入在它的子存在后封印。

所以按(thread, ns, checkpoint_id, channel)做键的条目是不可变的。

不需要失效。

共享后端跨进程是一致的。

包装绝不缓存"最新checkpoint"的解析。

只缓存按已解析的不可变checkpoint_id做键的历史。

数据生命周期如下。

线程删除和prune清除线程的缓存条目。

事实来源移除不能在缓存里留残余的历史载荷。

run级的删除不能便宜地映射到线程。依靠LRU和TTL边界。

这个类位于backend/packages/harness/deerflow/runtime/checkpointer/cached_saver.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、构造方法

构造方法接受inner、cache、key_prefix。

- inner是被包装的saver。
- cache是缓存后端。
- key_prefix是缓存键前缀。

实例属性覆盖基类的JsonPlusSerializer默认。

### 2、__getattr__方法

这是saver特有属性的安全网。

例如AsyncSqliteSaver.setup。

基类方法显式委托。

这个只对BaseCheckpointSaver没定义的属性触发。

### 3、_key方法

这个方法构建缓存键。

用_checkpoint_ref提取线程、命名空间、checkpoint id。

用make_history_key组装。

### 4、组合深度预算

_COMPOSE_MAX_DEPTH是8。

这是递归compose的深度预算。

预算耗尽前回退到链预热遍历。

稳态运行需要约2。

更深的冷链用一次预热遍历比多次递归单tuple取回快。

### 5、_channel_writes函数

这个函数返回一个channel的写入。

从最旧到最新。

### 6、缓存条目格式

条目是DeltaChannelHistory形状的字典。

包括writes和可选seed。

按不可变的(database, thread, namespace, checkpoint_id, channel)元组做键。

checkpoint lineage是追加式的。

一个checkpoint的历史排除自己的pending writes。

条目写入后永不变化。

正确性从不需要失效。

## 三、它和谁协作

- BaseCheckpointSaver是被包装的LangGraph saver。
- CheckpointHistoryCache和SyncCheckpointHistoryCache是缓存后端契约。
- make_history_key构建键。
- 线程删除和prune清除缓存。

## 四、重要性评级

评级是8分。

理由如下。

这个类是checkpoint历史的读缓存。

它减少多轮对话时重复读历史的成本。

正确性论证明确。

历史是祖先链的纯函数。

所以条目不可变。不需要失效。

深度预算让冷链用一次遍历。

数据生命周期有明确的清除语义。

它是数据库配置里checkpoint cache功能的执行者。

扣掉2分。

扣分原因是它是性能优化包装。

不影响语义。
