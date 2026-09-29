# MemoryStreamBridge运行日志-档案

## 一、这个类是干什么的

MemoryStreamBridge是runtime/stream_bridge/memory.py里的类。

它继承StreamBridge。

它是按run的内存事件日志实现。

事件按run保留有界时间窗口。

迟到的订阅者和重连的客户端能从Last-Event-ID重放缓冲的事件。

这个类位于backend/packages/harness/deerflow/runtime/stream_bridge/memory.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、_RunStream

_RunStream是单个run的事件日志。

events是StreamEvent列表。

condition是asyncio Condition。

ended标记结束。

start_offset是起点偏移。

### 2、构造方法

queue_maxsize默认256。

事件列表超过maxsize时删除溢出。

start_offset前移。

heartbeat_interval来自基类。

### 3、_next_id和_parse_event_seq

_next_id生成{ts}-{seq}格式的事件id。

ts是毫秒时间戳。seq是每run递增计数。

seq等于事件在run内的绝对偏移。

_parse_event_seq从事件id提取per-run序号。

不匹配格式的id返回None。

### 4、_resolve_start_offset方法

它解析重连起点。

last_event_id为None时返回start_offset。

事件id内嵌单调递增的seq。

等于绝对偏移。

所以用算术在O(1)内定位。

不扫描保留缓冲。

计算索引处验证保留的id。

id低于保留水位时没有时间戳可对照。

即使数字外来id也走保守gap路径。

重新加载持久状态更安全。

不静默宣称完整重放。

水位以上的未知id保持legacy从最早重放行为。

### 5、publish方法

发布事件。

condition锁下追加。

超maxsize时删除溢出并前移start_offset。

notify_all唤醒订阅者。

### 6、stream_exists

返回内存事件日志是否还有该run的数据。

## 三、它和谁协作

- StreamBridge是基类契约。
- run worker发布事件。
- SSE消费者订阅重放。
- stream_bridge/async_provider.py和redis.py是其他桥实现。

## 四、重要性评级

评级是6分。

理由如下。

这个类是内存模式流桥的实现。

Last-Event-ID重放带O(1)算术定位。

保守gap路径防静默错误重放。

condition协调发布和订阅。

有界窗口防内存增长。

这些质量不错。

扣掉4分。

扣分原因是它是单进程实现。多worker部署用Redis桥。
