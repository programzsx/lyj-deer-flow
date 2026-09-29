# StreamGap-档案

## 一、这个类是干什么的

StreamGap是runtime/stream_bridge/base.py里的冻结数据类。

它表示订阅者的cursor不能再完整重放。

它是StreamItem类型的一部分。另一种是StreamEvent。

这个类位于backend/packages/harness/deerflow/runtime/stream_bridge/base.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、字段

requested_event_id是重连cursor。或落后订阅者最近交付的事件。

earliest_available_event_id是保留缓冲里最早的事件。可为None。

latest_available_event_id是保留缓冲里最新的事件。可为None。

缓冲里什么都没保留时bounds是None。

### 2、语义

它让调用者重载durable状态并恢复到当前尾部。

调用者不会把部分重放误认为完整重放。

### 3、什么时候产生

Memory和Redis StreamBridge保留stream_bridge.queue_maxsize数据事件。

语法有效的Last-Event-ID比保留watermark旧时产生它。

落后订阅者在watermark之前时也产生它。

在任何部分重放之前产生。

### 4、sse_consumer的映射

sse_consumer把它映射为id-less的SSE gap payload。stream_replay_gap。

故意保持run活动。不取消它。

### 5、内部/wait消费者的处理

内部wait消费者从它最新的保留ID恢复。

它们只需要terminal完成。

### 6、sentinel

HEARTBEAT_SENTINEL和END_SENTINEL是StreamEvent。

END_SENTINEL是流结束标记。

## 三、它和谁协作

- MemoryStreamBridge和RedisStreamBridge产生它。
- sse_consumer映射它为gap payload。
- /wait消费者从它恢复。

## 四、重要性评级

评级是6分。

理由如下。

这个类是流重放完整性的控制信号。

cursor过期时产生gap而不是部分重放。

调用者能重载durable状态。不误认部分重放。

sse_consumer映射为gap payload并保持run活动。

Memory和Redis后端共享同一契约。

这些是流重放正确性的关键。

扣掉4分。

扣分原因是它是三个字段的信号类。机械在bridge里。
