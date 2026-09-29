# _RunStream-档案

## 一、这个类是干什么的

_RunStream是runtime/stream_bridge/memory.py里的内部数据类。

它是每个run的内存事件日志的持有结构。

字段是events、condition、ended、start_offset。

MemoryStreamBridge用它维护每个run的事件流。

这个类位于backend/packages/harness/deerflow/runtime/stream_bridge/memory.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、字段

events是StreamEvent列表。

condition是asyncio.Condition。订阅者等待新事件。

ended是bool。标记流已结束。

start_offset是起始偏移。标记事件窗口裁剪后的起点。

### 2、事件窗口

MemoryStreamBridge保留每个run的有界时间窗口的事件。

晚到的订阅者仍能重放窗口内的部分。

窗口外产生StreamGap。

### 3、MemoryStreamBridge的关系

它继承StreamBridge。

supports_cross_process为False。内存后端不跨进程。

publish、subscribe、join等操作操作_RunStream。

## 三、它和谁协作

- MemoryStreamBridge维护它。
- StreamEvent和StreamGap是它的事件项。
- 订阅者在condition上等待。

## 四、重要性评级

评级是4分。

理由如下。

这个类是内存流桥的持有结构。

events加condition加ended加start_offset。

start_offset支撑事件窗口裁剪。

condition支撑订阅者等待。

这些支撑内存流的正确性。

扣掉6分。

扣分原因是它是内部数据结构。逻辑在bridge里。
