# deerflow.runtime.checkpoint_mode 档案

## 一、这个模块是干什么的

这个模块管理checkpoint存储的"双模式"安全。

DeerFlow的checkpointer有两种通道模式。

一种是`full`模式。快照里存完整的channel值。

一种是`delta`模式。快照里只存哨兵加每一步的增量写入。

delta模式存储更省。但它有个陷阱。

一个跑在full模式的进程。如果直接打开一个delta模式的线程。会读到空的或者不完整的状态。

危险在于。这种读取不会报错。它会静默地给你空数据。

这个模块的任务就是让这件事"fail closed"。

发现不兼容就报错。绝不静默使用错误数据。

同时。模式是进程级冻结的。启动时定下。运行中不许换。想换必须重启。

## 二、模块里的主要成员

- `CheckpointModeMismatchError`。full模式进程读取delta线程时抛出的错误。

- `CheckpointModeReconfigurationError`。进程试图热切换持久化模式时抛出的错误。

- `freeze_checkpoint_channel_mode(mode)`。把模式冻结进进程全局变量。第一次冻结生效。之后传不同的模式就报错。

- `freeze_checkpoint_snapshot_frequency(snapshot_frequency)`。冻结delta模式的快照频率。频率必须为正。同样不许运行中变更。

- `resolve_checkpoint_snapshot_frequency()`。解析生效的频率。优先显式参数。然后是冻结值。最后是配置默认值。

- `inject_checkpoint_mode(config, mode)`。把模式写进config的`configurable`和`metadata`。delta模式会在checkpoint元数据里打上标记`deerflow_checkpoint_channel_mode: "delta"`。full模式会把标记去掉。所以"没有标记等于full"。老数据不用迁移。

- `checkpoint_metadata_uses_delta(metadata)`。检测元数据是否带delta标记。同时也认上游的`counters_since_delta_snapshot.messages`字段。

- `checkpoint_tuple_uses_delta`和`state_snapshot_uses_delta`。分别在checkpoint元组层和StateSnapshot层做同样的检测。

- `raise_if_snapshot_incompatible(snapshot, mode)`。fail closed的读闸门。full进程读到delta快照就报错。它只花一次checkpoint读取的成本。因为标记就在元数据里。

- `ensure_checkpoint_mode_compatible(checkpointer, config, mode)`。写之前的闸门。写操作不能撤销。所以写入前必须检查。delta模式直接放行。full模式要先读一次元组。

- `aensure_checkpoint_mode_compatible`。上面那个的异步版本。

## 三、它和谁协作

它依赖`deerflow.config.database_config`。从那里拿模式类型和默认频率。

它被`checkpoint_state.py`依赖。那是所有checkpoint读写的唯一咽喉。

它被`agents/thread_state.py`和lead agent工厂依赖。工厂在编译图之前冻结模式。

Gateway的threads路由把它的错误映射成HTTP 409和503。

## 四、重要性评级

评级是8分。

理由如下。

持久化正确性是系统的底线。静默读到空消息列表会直接毁掉用户的对话历史。

这个模块同时守住了三件事。模式冻结。标记注入。兼容闸门。

full到delta是支持的迁移路径。delta到full必须先物化。这个不对称规则也在这里实现。

它是所有checkpoint访问的必经前置检查。

扣掉2分是因为它是单一职责的守门模块。业务复杂度不在这里。但它的守门地位不可替代。
