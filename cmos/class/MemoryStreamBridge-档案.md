# MemoryStreamBridge-档案

## 一、这个类是干什么的

MemoryStreamBridge是runtime/stream_bridge/memory.py里的类。

它是每运行的内存事件日志实现。

它继承StreamBridge。

事件按运行保留有界时间窗口。

迟到的订阅者和重连的客户端能从Last-Event-ID重放缓冲事件。

这个类不支持跨进程。

这个类位于backend/packages/harness/deerflow/runtime/stream_bridge/memory.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、构造方法

构造方法接受queue_maxsize和heartbeat_interval。

queue_maxsize默认256。这是每个流保留的最大事件数。

_streams是按run_id做键的流字典。

_counters是按run_id做键的事件序号计数器。

### 2、publish方法

这个方法发布一个事件。

事件id用_next_id生成。

追加到事件列表。

超过maxsize时删除最早的。

start_offset递增。

然后唤醒所有订阅者。

### 3、subscribe方法

这是核心订阅方法。

它返回AsyncIterator。

支持Last-Event-ID重放。

_ resolve_start_offset解析起始偏移。

游标落后于保留水位时产生StreamGap。

游标能定位时用算术在O(1)定位。

不扫描保留缓冲。

保留id在计算索引处验证。

id低于保留水位时没有时间戳可对照。

数字foreign id走保守的gap路径。

重载持久状态比悄悄声称完整重放更安全。

水位以上的未知id保持旧的从最早重放行为。

订阅循环里落后于缓冲时发gap并停止。

正常时逐条yield。

结束时发END_SENTINEL。

空闲超过心跳间隔时发HEARTBEAT_SENTINEL。

### 4、_parse_event_seq函数

这个函数从{ts}-{seq}格式的事件id提取每运行序号。

seq每次发布加一。

等于事件在运行内的绝对偏移。

格式不匹配时返回None。

### 5、cleanup和close方法

cleanup移除一个运行的流。

close清空全部。

## 三、它和谁协作

- StreamBridge是它的基类。
- run_agent发布事件。
- sse_consumer订阅。
- RedisStreamBridge是跨进程的兄弟实现。

## 四、重要性评级

评级是7分。

理由如下。

这个类是Gateway流式的默认实现。

Last-Event-ID重放靠它。

O(1)算术定位避免扫描缓冲。

StreamGap让部分重放可检测。

保守的gap路径防止foreign id假声称完整重放。

心跳保持SSE连接。

它是单进程部署的流基础设施。

扣掉3分。

扣分原因是它不支持跨进程。

多worker部署需要Redis实现。
