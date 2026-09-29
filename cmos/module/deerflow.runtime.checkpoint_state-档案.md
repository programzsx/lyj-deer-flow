# deerflow.runtime.checkpoint_state 档案

## 一、这个模块是干什么的

这个模块是线程checkpoint状态读写的"唯一咽喉"。

背景是这样的。

delta模式的checkpoint不存完整的`channel_values`。直接调checkpointer的原始读。只会看到哨兵数据。

所以消费者不能绕过。必须经过一个统一的访问器。

这个访问器绑定三样东西。编译好的图。checkpointer。冻结的通道模式。

每一次操作都会做两件事。把模式标记注入config。过一遍兼容性闸门。然后才碰状态。

这个模块还提供一个"仅状态变更图"的构建器。

用途是整体替换状态。例如回滚恢复。例如上下文压缩。

这个图只有一个空操作节点。写完就结束。不调度任何agent节点。所以写入的头部checkpoint保持空闲。不会重新触发agent。

## 二、模块里的主要成员

- `CheckpointStateAccessor`。核心数据类。绑定graph、checkpointer、mode三个字段。

- `CheckpointStateAccessor.bind(graph, checkpointer, store, mode)`。类方法。把checkpointer和store挂到图上。返回访问器实例。

- `get`和`aget`。读物化状态快照。读之前注入模式标记。读完做兼容性检查。

- `get_metadata`和`aget_metadata`。只读checkpoint元数据。不物化channel状态。省成本但保留闸门。

- `history`和`ahistory`。读状态历史。支持limit参数。limit为0表示显式空。limit为None表示不限制。每个快照都过闸门。

- `update`和`aupdate`。写状态。写之前先过预写闸门。

- `build_state_mutation_graph(as_node, mode, state_schema)`。编译一个单节点状态变更图。`as_node`必须提供。`state_schema`必须是线程的生效schema。用基础ThreadState兜底会静默丢弃自定义middleware贡献的channel。

- `graph_state_schema(graph)`。返回编译图用的状态schema类。

- `graph_writable_channels(graph)`。返回用户可见的channel名。排除`__*`内部channel和`branch:*`分支channel。

- `graph_reducer_channels(graph)`。返回需要通过reducer合并写入的channel名。覆盖经典reducer和delta channel。这些channel的替换式写入必须包`Overwrite`。

## 三、它和谁协作

它依赖`checkpoint_mode.py`。用它的注入和闸门函数。

它依赖`agents/thread_state.py`拿默认schema。

它依赖langgraph的StateGraph来编译变更图。

它的消费方是`context_compaction.py`和`runtime/runs/worker.py`。回滚和压缩都走这里。

Gateway的threads路由也通过访问器读线程状态。

## 四、重要性评级

评级是9分。

理由如下。

AGENTS.md明确写着"绝不要绕过CheckpointStateAccessor访问线程状态"。

它是模式兼容性和状态一致性的执行点。绕过它。delta模式的数据就会以空状态的形式暴露给用户。

回滚和压缩这两个关键写路径都依赖它的变更图。schema选错会静默丢数据。

它把"怎么安全地读写checkpoint"这个复杂问题封装成了一个绑定型对象。

扣1分是因为它的正确性很大程度上建立在checkpoint_mode模块之上。它是执行者而非规则制定者。
