# CheckpointStateAccessor-档案

## 一、这个类是干什么的

CheckpointStateAccessor是runtime/checkpoint_state.py里的类。

它是线程checkpoint状态读取和写入的唯一咽喉点。

它绑定一个编译好的图（携带模式匹配的channel schema）、一个checkpointer和冻结的channel模式。

每个操作把模式标记注入config并通过兼容门。

然后才碰状态。

Delta checkpoint不存完整的channel_values。

原始saver读看到的是哨兵。

所以消费方必须经过这个访问器。

而不是直接调用checkpointer。

这个类位于backend/packages/harness/deerflow/runtime/checkpoint_state.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、CheckpointStateAccessor

它bind静态方法绑定图、checkpointer和模式。

所有操作都注入模式标记并通过兼容门。

delta模式下原始saver读看到哨兵。

这是消费方必须用它而不是直接调checkpointer的原因。

### 2、build_state_mutation_graph函数

这个函数编译一个状态专用的图。

单节点。一个no-op节点。入口等于finish。

用于整体状态替换。

例如回滚恢复和上下文压缩。

它共享代理图的checkpoint机制。

但调度没有pending节点。

写出的head保持空闲。

update_state要求节点注册在图里。

专用单节点图应用reducer写入并结束。

mutation checkpoint不调度代理节点。

### 3、state_schema要求

state_schema必须是线程的有效schema。

代理图编译用的那个类。

写携带物化状态时必须如此。

基类ThreadState回退不知道自定义中间件贡献的channel。

写到未知channel会被悄悄丢弃。

回退按显式参数、进程冻结、配置默认解析delta快照节奏。

显式state_schema已在身份里带节奏。

### 4、graph_state_schema函数

这个函数从图提取state schema。

## 三、它和谁协作

- checkpoint_mode模块提供模式注入和兼容门。
- thread_state的get_thread_state_schema提供schema。
- 手动compaction和状态更新路由通过它写状态。
- DeerFlowClient.get_thread用它读历史。

## 四、重要性评级

评级是7分。

理由如下。

这个类是checkpoint状态读写的唯一咽喉点。

delta模式下原始saver读看到哨兵。

直接调checkpointer会读到错的数据。

模式注入和兼容门保证每次操作都匹配冻结模式。

build_state_mutation_graph让回滚和压缩共享checkpoint机制。

state_schema的要求防止未知channel写入被悄悄丢弃。

这些是状态一致性的关键。

扣掉3分。

扣分原因是它是读写转发层。
