# checkpoint_mode-档案

## 一、这个类是干什么的

checkpoint_mode不是类。

checkpoint_mode是runtime/checkpoint_mode.py里的模块。

它实现双模式checkpoint channel安全。

模式冻结、元数据标记和fail-closed门。

checkpointer存储跑在full模式或delta模式。

full模式是完整快照的channel值。

delta模式是LangGraph的DeltaChannel。哨兵blob加每步写入。

模式在代理构建时进程冻结。

写入时盖进每个checkpoint的元数据。

每次状态访问前强制执行。

full模式的进程打开delta线程抛CheckpointModeMismatchError。

而不是悄悄物化空状态。

delta模式的进程透明地读legacy full checkpoint。

full到delta是支持的迁移路径。

这个模块位于backend/packages/harness/deerflow/runtime/checkpoint_mode.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、常量

- INTERNAL_CHECKPOINT_MODE_KEY的值是"__deerflow_checkpoint_channel_mode"。这是内部configurable键。
- CHECKPOINT_MODE_METADATA_KEY的值是"deerflow_checkpoint_channel_mode"。这是checkpoint元数据键。

### 2、异常类

- CheckpointModeMismatchError在full模式图读delta checkpoint之前抛出。
- CheckpointModeReconfigurationError在进程尝试热切换持久化模式时抛出。

### 3、freeze_checkpoint_channel_mode函数

这个函数冻结进程的channel模式。

第一次冻结生效。

不匹配时抛CheckpointModeReconfigurationError。

checkpoint_channel_mode是restart-required的。

不能在运行中的进程里变。

### 4、freeze_checkpoint_snapshot_frequency函数

这个函数冻结delta快照节奏。

节奏编译进每个图的channel表。

像模式一样是restart-required的。

共享一个checkpoint数据库的每个进程必须匹配。

它故意不盖进checkpoint元数据。

模式标记契约（缺席等于full）和full到delta迁移语义不受频率值影响。

### 5、注入和兼容检查

inject_checkpoint_mode把模式注入config。

ensure_checkpoint_mode_compatible通过兼容门。

raise_if_checkpoint_tuple_incompatible和raise_if_snapshot_incompatible检查checkpoint元数据。

## 三、它和谁协作

- assemble_lead_agent在代理构建时冻结模式。
- CheckpointStateAccessor的每个操作通过兼容门。
- DeerFlowClient和worker读checkpoint时经过兼容检查。
- checkpoint_state的模式标记决定读取行为。

## 四、重要性评级

评级是8分。

理由如下。

这个模块是checkpoint模式安全的核心。

full模式进程读delta线程会悄悄物化空状态。

这是严重的数据错误。

fail-closed门防止它。

模式冻结防止运行中热切换。

防止伪造键重新配置进程。

full到delta的迁移路径被支持。

节奏和模式一起冻结。

这些是多模式持久化的正确性关键。

扣掉2分。

扣分原因是它只是模式守卫。

存储本身在LangGraph。
