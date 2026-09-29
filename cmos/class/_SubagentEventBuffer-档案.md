# _SubagentEventBuffer档案

源码位置：backend/packages/harness/deerflow/runtime/runs/worker.py

## 一、这个类是干什么的

_SubagentEventBuffer是子代理step事件的批量缓冲器。

_SubagentEventBuffer把子代理的task_* step事件攒起来。攒够一批后一次性写入事件存储。

攒批的原因是事件存储的put是低频路径。Postgres上每次put开自己的事务还要拿per-thread advisory锁。深层子代理一个general-purpose最多跑150轮。热流循环上会发几百个task_running事件。逐个put会串行化。会卡住运行自己的消息批量写入。

live SSE桥已经实时转发这些事件。这个缓冲器额外做持久化。让子任务卡的步骤历史在页面刷新后还在。

类名带下划线前缀。这是worker.py的内部类。

## 二、类的成员

（一）字段

- `_event_store`：运行事件存储。可以为空。为空时是no-op。
- `_thread_id`：所属线程ID。
- `_run_id`：所属运行ID。
- `_pending`：待写入的事件列表。
- `FLUSH_THRESHOLD`：类常量。25。缓冲到25个事件就flush。

（二）方法

- `add()`：缓冲一个custom流chunk。用subagent_run_event识别chunk。不是子代理事件就不缓冲。terminal事件subagent.end立即flush。达到阈值也flush。
- `flush()`：把缓冲的事件用一次put_batch写入。写入前清空缓冲。flush失败会把批次放回缓冲。等待下次flush。store错误被吞掉。不传播到流循环。
- flush是best-effort的。没有store就是no-op。terminal事件flush是急切的。让完成的子代理步骤历史及时落库。

## 三、它和谁协作

（一）_publish_stream_item

worker.py的_publish_stream_item在custom模式下调add。根命名空间才调用。子图命名空间不调用。

（二）RunEventStore

_SubagentEventBuffer通过event_store的put_batch写批量事件。put_batch拿一次锁。

（三）subagents.step_events

deerflow.subagents.step_events的subagent_run_event函数识别chunk。识别用懒导入。避免包根的循环导入死锁。

## 四、重要性评级

评级：5分。

理由：_SubagentEventBuffer解决了一个真实的性能问题。深层子代理几百个step事件逐个put会卡住消息写入。批量写解决了它。它还保证了步骤历史在刷新后还在。失败时批次放回缓冲不丢事件。它只影响事件持久化层。所以给5分。
