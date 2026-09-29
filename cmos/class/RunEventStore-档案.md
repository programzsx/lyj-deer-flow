# RunEventStore-档案

## 一、这个类是干什么的

RunEventStore是runtime/events/store/base.py里的抽象基类。

它是运行事件流的统一存储接口。

消息（前端展示）和执行追踪（调试和审计）走同一接口。

用category字段区分。

它有三个实现。

MemoryRunEventStore是内存字典。开发和测试用。

DbRunEventStore是SQLAlchemy ORM实现的持久化。

JsonlRunEventStore是JSONL文件持久化。本地和调试用。

这个类位于backend/packages/harness/deerflow/runtime/events/store/base.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、所有实现必须保证的性质

- put()写的事件能在后续查询里取回。
- seq在同一线程内严格递增。
- list_messages()只返回category="message"的事件。
- list_events()返回指定运行的全部事件。
- 返回的字典包含必需的RunEvent信封字段。
- find_latest_ai_message_run_ids()对每个请求的id返回最新的有效AI消息事件。空输入不做存储工作。

### 2、put方法

写一个事件，自动分配seq，返回完整记录。

参数包括thread_id、run_id、event_type、category、content、metadata、created_at。

### 3、put_batch方法

批量写事件。RunJournal的flush缓冲用。

每个字典的键匹配put的关键字参数。

返回带seq的完整记录。

### 4、put_if_absent方法

不存在时才写。幂等写入。

### 5、IncompleteMessageRunLookupError

store不能证明目标查找是完整时抛这个异常。

### 6、match_ai_message_run_id函数

这个函数返回目标AI消息id和它的有效run id。

检查category是message、content的type是ai、run_id有效、message_id在请求集合里。

### 7、DbRunEventStore的实现细节

per-thread的asyncio锁串行同一线程的并发进程内写入者的seq分配。

数据库级的FOR UPDATE或advisory锁管跨进程竞争。

这管常见的单进程情况。

两个协程在max(seq)读和INSERT之间交错会在seq上碰撞。

weak registry保持一代锁。

delete_by_thread显式退役那个线程。

退役后未完成的用户单独保持那代锁活到它们排空。

trace内容截断在max_trace_content字节。默认10240。避免数据库膨胀。

## 三、它和谁协作

- RunJournal通过put_batch写入事件。
- MemoryRunEventStore、DbRunEventStore、JsonlRunEventStore是三个实现。
- worker的_SubagentEventBuffer持久化subagent事件。
- frontend的list_messages和list_events消费事件。

## 四、重要性评级

评级是7分。

理由如下。

这个接口是运行事件的统一存储。

消息和追踪走同一接口。

seq严格递增支撑Last-Event-ID重放和续页。

DbRunEventStore的per-thread锁处理seq分配竞争。

put_batch支撑RunJournal的缓冲写入。

但它是接口定义。

逻辑在实现里。

扣掉3分。
