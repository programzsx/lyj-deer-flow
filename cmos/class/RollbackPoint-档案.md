# RollbackPoint档案

源码位置：backend/packages/harness/deerflow/runtime/runs/worker.py

## 一、这个类是干什么的

RollbackPoint是运行前状态快照的不可变记录。

RollbackPoint保存取消前线程的完整检查点状态。取消带回滚时线程恢复到这个快照。

RollbackPoint保存的不是一个raw checkpoint blob。因为delta模式的checkpoint不保存物化的消息值。raw blob无法重建消息。

RollbackPoint同时保存三种内容。

- 物化的消息列表。delta模式的消息在这里。
- delta模式的物化非消息状态。
- raw pending_writes。

RollbackPoint是不可变的。类声明用了frozen=True。快照不能被运行过程污染。

快照捕获在运行开始前完成。捕获失败会禁用回滚。这是fail-closed设计。绝不恢复部分状态。

## 二、类的成员

（一）字段

- `config`：检查点定位配置。包含thread_id、checkpoint_ns、checkpoint_id。恢复时用这个config定位原始checkpoint。
- `state_values`：物化的非消息状态。只有delta模式才保存。full模式是空字典。内容做了深拷贝。
- `messages`：物化的消息元组。delta模式的消息保存在这里。raw checkpoint blob里没有这些消息。
- `metadata`：检查点元数据。
- `pending_writes`：raw pending writes元组。恢复时重新挂到恢复后的checkpoint上。

（二）方法

RollbackPoint是frozen dataclass。RollbackPoint没有自定义方法。

## 三、它和谁协作

（一）_capture_rollback_point

worker.py的_capture_rollback_point函数构建RollbackPoint。捕获发生在运行开始前。通过CheckpointStateAccessor物化状态。

（二）回滚写入路径

取消带rollback时回滚路径消费RollbackPoint。delta模式用Overwrite把捕获的每个通道写回当前head。full模式从pre-run checkpoint分叉。

（三）CheckpointStateAccessor

捕获通过accessor的aget读取物化状态。通过checkpointer的aget_tuple读取raw pending_writes。

## 四、重要性评级

评级：6分。

理由：RollbackPoint是取消回滚功能的核心数据结构。delta模式不能靠raw blob回滚。消息必须在这里保存。没有它，取消带回滚就会丢消息或丢状态。它是worker回滚流程的关键一环。所以给6分。
