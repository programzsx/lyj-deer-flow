# deerflow.runtime.stream_bridge.memory-档案

## 一、这个模块是干什么的

这个文件是流桥的内存实现。

数据结构是进程内的事件日志。

单进程部署用它。它是默认桥。

每个run保留一段有界时间窗的事件。晚到的订阅者和重连的客户端可以从Last-Event-ID重放缓冲里的事件。

不支持跨进程。多worker部署用redis桥。

## 二、模块里的主要成员

### 1、_RunStream数据类

这是单个run的内部状态。

events是事件列表。

condition是asyncio.Condition。订阅者用它等待新事件。

ended标记生产者是否已经结束。

start_offset是缓冲的起始偏移。缓冲溢出时偏移增加。

### 2、MemoryStreamBridge类

这个类继承StreamBridge。

#### （1）事件id

_next_id生成事件id。格式是毫秒时间戳-序号。

序号每个事件加一。所以序号等于事件在run里的绝对偏移。

_parse_event_seq从事件id里提取序号。用正则。格式不匹配返回None。

序号等于绝对偏移。这个性质让重连定位用算术完成。不用扫描缓冲。

#### （2）publish发布

发布一个事件。

条件锁内追加事件。超过容量时从头部删除溢出部分。start_offset相应增加。然后notify_all唤醒全部等待的订阅者。

#### （3）publish_end结束

条件锁内设置ended标记。notify_all。

#### （4）_resolve_start_offset重连定位

这个函数解析重连的起始偏移。

last_event_id是None时从缓冲起点开始。

有序号时用算术定位。序号小于start_offset说明事件已被淘汰。返回StreamGap。

算出的索引上验证保留的事件id。id匹配就从下一个位置开始。

id不匹配时。缓冲里有事件就记警告。从最早保留的事件开始重放。这是legacy行为。保守的gap路径比重放更安全。因为无法验证的时间戳可能是外来的id。

#### （5）subscribe订阅

订阅是异步生成器。

先解析起始偏移。是StreamGap就yield gap然后返回。

然后循环。

条件锁内判断。游标落后于start_offset时生成gap并停止。

索引有效时取事件。游标加一。

ended且没有更多事件时yield结束哨兵。

否则等condition。超时yield心跳哨兵。有新事件就continue重查。

#### （6）cleanup和close

cleanup等delay后删除run的流和计数器。

close清空全部流和计数器。

#### （7）stream_exists

这个方法判断run的进程内事件日志是否还有数据。

## 三、它和谁协作

它继承runtime.stream_bridge.base里的StreamBridge。

它被runtime.stream_bridge.async_provider创建。默认类型。

它被runtime.runs.worker调用。worker发布事件。

它被Gateway的SSE端点消费。

它只用asyncio标准库和正则。

## 四、重要性评级

评级是7分。

理由是这个文件是默认的流桥。

本地开发、测试、单进程部署的SSE流全部经过它。

算术定位和落后检测保护了重连的正确性。

订阅循环的心跳和结束信号语义是SSE连接的骨架。

不评更高分是因为它不支持跨进程。生产多worker部署用redis桥。
