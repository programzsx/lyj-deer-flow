# CheckpointStateAccessor档案

源码位置：`backend/packages/harness/deerflow/runtime/checkpoint_state.py`

## 一、这个类是干什么的

这个类是检查点状态访问器。

这个类是线程检查点状态读写的唯一咽喉点。

这个类把三样东西绑在一起。

第一样，编译好的图。图带着模式匹配的通道schema。

第二样，checkpointer。检查点的存储后端。

第三样，冻结的通道模式。full或delta。

每次操作都做两件事。

第一件，把模式标记注入config。

第二件，过兼容性门。

然后才碰状态。

delta检查点不存完整的channel_values。

直接调checkpointer的原始读取只能看到哨兵。

所以消费方必须经过这个访问器。

不能直接调checkpointer。

这是强制约定。

run rollback、上下文压缩、线程状态读写。

全部走这个访问器。

这个模块还有一个独立函数`build_state_mutation_graph`。

这个函数编译一个纯状态图。

图里只有一个空节点。

入口即终点。

这个图用于整体状态替换。

比如回滚恢复和上下文压缩。

它和agent图共享检查点机制。

但不调度任何待执行节点。

写入的头部保持空闲。

不会重新触发agent。

## 二、类的成员

### （一）字段

- `graph`：编译好的LangGraph图。带着模式匹配的通道schema。get和history实际调的是图的state读取。
- `checkpointer`：检查点存储后端。元数据读取和写前检查直接调它。
- `mode`：冻结的通道模式。`full`或`delta`。

### （二）类方法

- `bind`：构造绑定好的访问器。把checkpointer挂到图上。可选挂store。返回访问器实例。

### （三）实例方法

- `_prepare_config`：准备config。复制configurable和metadata。注入模式标记。每个操作都先过这里。
- `get`：同步读取物化状态。调图的get_state。过快照兼容门。不兼容就抛`CheckpointModeMismatchError`。
- `aget`：异步版get。
- `get_metadata`：只读检查点元数据。不物化通道状态。调checkpointer的get_tuple。过元数据兼容门。
- `aget_metadata`：异步版get_metadata。
- `history`：读检查点历史。limit为0表示零条。None表示不限。每个快照都过兼容门。
- `ahistory`：异步版history。
- `update`：同步写状态。写前先过兼容门。写是不可撤销的。所以提前检查。
- `aupdate`：异步版update。

### （四）模块级函数

- `build_state_mutation_graph`：编译纯状态图。一个空节点。入口即终点。用于回滚恢复和压缩。schema必须用线程的实际schema。基础ThreadState不知道中间件贡献的通道。写未知通道会被静默丢弃。
- `graph_state_schema`：返回图编译时用的schema类。
- `graph_writable_channels`：返回图的用户可见通道名。排除内部通道和分支通道。
- `graph_reducer_channels`：返回走reducer合并的通道名。这些通道的替换写入要包`Overwrite`。

## 三、它和谁协作

这个类和checkpoint_mode模块协作。

模式标记注入和兼容门都来自那里。

`inject_checkpoint_mode`、`raise_if_snapshot_incompatible`、`ensure_checkpoint_mode_compatible`。

这个类和runs worker协作。

回滚流程通过访问器物化完整的运行前状态。

这个类和context_compaction协作。

手动压缩通过访问器读快照、写压缩后的状态。

这个类和Gateway协作。

访问器图的缓存按用户和快照频率管理。

线程状态的元数据读取走`get_metadata`保留模式门。

这个类和`build_state_mutation_graph`协作。

回滚和压缩用这个函数编译的纯状态图做写入。

## 四、重要性评级

评级：8分（满分10分）。

理由：

- 这个类是检查点状态访问的唯一入口。
- 它是模式安全和数据完整性的咽喉点。
- delta检查点存的是哨兵。
- 绕过它直接读checkpointer只能看到空状态。
- 它强制每个操作都注入模式标记、过兼容门。
- full模式进程读delta线程在这里被拦下。
- 它保证了回滚和压缩写入用对schema。
- 中间件贡献的通道不会被静默丢弃。
- 没有它，检查点模式的不变量会被各处绕过。
- 核心运行时类评7到9分。
- 它本身是薄封装。
- 逻辑大部分委托给图和checkpointer。
- 评8分。
