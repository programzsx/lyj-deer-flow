# MemoryRunEventStore-档案

## 一、这个类是干什么的

MemoryRunEventStore是runtime/events/store/memory.py里的类。

它继承RunEventStore。

它是内存事件存储。

run_events.backend为memory时使用。这是默认。测试也用。

单进程异步使用线程安全。

所有变更发生在同一事件循环。

不需要threading锁。

这个类位于backend/packages/harness/deerflow/runtime/events/store/memory.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、投影结构

_events是thread_id到seq排序事件列表。

_messages是消息only投影。

同一dict对象。无拷贝。

seq排序。消息分页O(log m加page)用bisect。

不每次请求重扫全部事件。

_events_by_run和_messages_by_run是run键投影。

同一dict对象。无拷贝。

per-run读成本O(events-in-run)。

不是O(events-in-thread)。

没有这些list_events和list_messages_by_run每次请求重扫整个线程的事件日志。

一个run只持少量事件。

这是thread-wide _messages投影的per-run类似物。

_seq_counters是thread_id到最后的seq。

### 2、_put_one

seq递增。

记录带thread_id、run_id、event_type、category、content、metadata、seq、created_at。

### 3、读路径

list_events按event_types过滤。

list_messages_by_run按run读消息。

bisect分页。

AUTO哨兵处理user_context。

## 三、它和谁协作

- RunEventStore是基类契约。
- RunJournal写事件。
- message_identity做消息身份。
- DbRunEventStore和JsonlRunEventStore是其他后端。

## 四、重要性评级

评级是5分。

理由如下。

这个类是内存事件存储的实现。

多层投影。消息only、按run。

bisect分页O(log m加page)。

同一dict对象无拷贝。

per-run投影让list_events不重扫整个线程。

这些性能设计好。

扣掉5分。

扣分原因是它是默认内存后端。无持久化。
