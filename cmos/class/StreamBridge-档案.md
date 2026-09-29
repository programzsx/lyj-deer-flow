# StreamBridge-档案

## 一、这个类是干什么的

StreamBridge是runtime/stream_bridge/base.py里的抽象基类。

它是流桥协议。

StreamBridge把代理worker（生产者）和SSE端点（消费者）解耦。

对齐LangGraph Platform的Queue加StreamManager架构。

生产者是运行代理的worker。

消费者是HTTP的SSE端点。

两者通过桥接解耦。

这个类定义了流事件的抽象契约。

这个类位于backend/packages/harness/deerflow/runtime/stream_bridge/base.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、StreamEvent数据类

这是frozen的数据类。

它表示单个流事件。

- id是单调递增的事件id。作为SSE的id字段。支持Last-Event-ID重连。
- event是SSE事件名。例如"metadata"、"updates"、"events"、"error"、"end"。
- data是JSON可序列化的载荷。

### 2、StreamGap数据类

这是frozen的数据类。

它表示订阅者游标无法完整重放。

- requested_event_id是重连游标。或落后于现场的订阅者最近收到的事件。
- earliest_available_event_id是缓冲里最早的可用事件。
- latest_available_event_id是最新的可用事件。

保留的边界让调用方重载持久状态并从当前尾部恢复。

不把部分重放误当完整重放。

缓冲里什么都没保留时边界是None。

### 3、哨兵

- HEARTBEAT_SENTINEL是心跳哨兵。event是__heartbeat__。
- END_SENTINEL是结束哨兵。event是__end__。

### 4、StreamBridge抽象类

- supports_cross_process标记是否支持跨进程。默认False。
- heartbeat_interval是订阅者心跳之间的默认空闲秒数。
- _validate_heartbeat_interval验证心跳间隔。必须是正的有限数。不超过最大值。bool被拒绝。

### 5、实现

MemoryStreamBridge是每运行的内存事件日志实现。

RedisStreamBridge是跨进程的Redis实现。

MemoryStreamBridge按运行保留事件的有界时间窗口。

迟到的订阅者和重连的客户端能从Last-Event-ID重放缓冲事件。

事件id格式是{ts}-{seq}。

seq每次发布加一。

等于事件在运行内的绝对偏移。

## 三、它和谁协作

- run_agent是生产者，发布事件。
- sse_consumer是消费者，订阅事件。
- MemoryStreamBridge和RedisStreamBridge是两个实现。
- StreamBridgeConfig提供配置。

## 四、重要性评级

评级是7分。

理由如下。

StreamBridge是Gateway流式架构的核心抽象。

它解耦生产者和消费者。

Last-Event-ID重连靠事件id。

StreamGap让调用方区分部分重放和完整重放。

心跳保持SSE连接。

这是SSE可靠投递的基础。

但它是抽象契约。

逻辑在实现里。

扣掉3分。
