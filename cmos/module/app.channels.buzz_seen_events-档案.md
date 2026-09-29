# app.channels.buzz_seen_events 档案

## 一、这个模块是干什么的

buzz_seen_events.py是Buzz聊天事件的持久化去重存储。

这个模块记录哪些Buzz聊天事件已经被完整处理过。

这个模块存在的原因是堵一个重放漏洞。Buzz连接器的重订阅过滤器刻意偏向重放而不是跳过。NIP-01的`since`是包含式的。所以每次重连至少会重发最后一条已处理事件。管理器的入站去重能吸收这些重发。但管理器的默认去重是进程内的，TTL只有10分钟。超过10分钟后的重连（或任何gateway重启）会对已回答过的消息重新跑一次agent。

这个模块在连接器这一层堵住这个缺口。完整处理过的事件id按频道持久化。重发的id在到达消息总线之前就被丢弃。

去重只用精确的事件id，从不用时间戳。新事件总有新id。所以一个真正的新事件永远不会被跳过。这保住了连接器"偏向重放"的失败不变量。

失败策略是双向fail-open。文件读不了就当空表加载。代价最多是重放一次已回答的消息。写失败就记日志、下次flush重试。代价是重放，永远不会是跳过。

## 二、模块里的主要成员

### 1、模块级常量

- `FLUSH_DELAY_SECONDS`（1.0）。持久化的合并窗口。崩溃丢失这个窗口内的记录只会带来重放，不会带来跳过。
- `MAX_IDS_PER_CHANNEL`（512）。每频道保留的事件id上限。正常重连只重放一条水位事件。深重放场景是游标被驱逐后的中继默认积压窗口。两者都远低于这个上限。
- `MAX_CHANNELS`（512）。频道映射的容量上限。与其他远端喂入的映射保持一致。频道id来自远端`h`标签。

### 2、BuzzSeenEventStore类

这是一个有界的、JSON持久化的"频道id到近期已处理事件id"映射。

#### （1）构造与持久化

- `__init__(path)`。`path=None`表示纯内存模式。纯内存模式不读也不写文件。这正好是旧的（非持久化）行为。测试和工具直接构造通道时不应产生建目录写文件的副作用。
- `_ensure_loaded()`。懒加载JSON文件。加载在`_load_lock`保护下只发生一次。文件读不了就打WARNING并从空表开始。`_loaded`标志在所有条目可见之后才发布。异步热路径可能不加锁读这个标志。
- `_snapshot()`。把`_ids`拷贝成"频道到id列表"的快照。
- `_write_snapshot(payload)`。写快照到文件。用同目录临时文件加`replace`做原子替换。崩溃中途写不会截断存储。失败时清理临时文件，绝不留下`*.tmp`残留。
- `_save()`。同步写并清脏标志。
- `_flush_once()`。异步单次flush。写通过`asyncio.to_thread`在worker线程跑。写期间有新记录到达时（代数变化）保持脏标志，留给下次flush。
- `_enforce_channel_cap()`。频道数超限时按FIFO驱逐最旧的频道。

#### （2）合并式定时持久化

- `_request_flush()`。合并式持久化入口。每个`FLUSH_DELAY_SECONDS`最多一次写。没有运行中的事件循环时（测试、工具）同步写。过期定时器句柄（属于已关闭循环）会被取消重排，否则会永远阻塞调度、静默停止持久化。
- `quiesce()`。停用自动持久化。迟到的记录保留为脏状态。
- `resume()`。恢复自动持久化并调度保留的脏状态。
- `_flush_scheduled()`。定时器到期后的处理。已有进行中的flush任务时跳过。否则创建flush任务。
- `_flush_finished(task)`。普通flush任务的完成回调。写成功但快照已过期时，把更新的代数排进下一个合并窗口。写失败时等下一条记录或显式flush，不每秒在坏文件系统上空转。
- `_final_flush_finished(task)`。stop拥有的写任务的完成回调。任务完成后不排任何新工作。

#### （3）最终flush与查询API

- `aflush()`。做一次有界的最终持久化，不阻塞事件循环。先取消定时器。等待进行中的写时用`asyncio.shield`保护，gateway取消stop不能取消worker线程里的写。需要时再尝试最多一次更新的快照。finally里保证不留任何属于已停通道的定时器。
- `flush()`。同步立即持久化。在通道stop时调用。干净关停绝不把记录丢给合并窗口。
- `seen(channel_id, event_id)`。同步查询。事件id在该频道已完整处理过则返回True。
- `aseen(channel_id, event_id)`。异步查询。初始文件加载通过`asyncio.to_thread`离线进行。
- `record(channel_id, event_id)`。同步记录并调度合并式持久化。
- `arecord(channel_id, event_id)`。异步记录。不在事件循环上做文件I/O。
- `_record_loaded(channel_id, event_id)`。核心记录逻辑。每频道用`deque`（带maxlen）加`set`双结构。deque保证有界，set保证O(1)查询。满了先从set里丢最旧的id。频道移到`OrderedDict`尾部，让频道容量驱逐近似LRU。代数计数器加一。请求flush。

### 3、同步与异步双接口

同步的`seen`/`record`/`flush`保留给测试和事件循环外的工具。Gateway事件循环上的调用者必须用`aseen`/`arecord`/`aflush`。异步接口把文件系统访问放到worker线程上。这保证事件循环不被文件I/O阻塞。

## 三、它和谁协作

### 1、它依赖谁

- Python标准库。`asyncio`、`json`、`tempfile`、`threading`、`collections`、`pathlib`。没有第三方依赖。

### 2、谁调用它

- `app.channels.buzz.BuzzChannel`。唯一的运行时调用方。BuzzChannel在`__init__`里创建本存储。入站路径上用`aseen`检查重放、用`arecord`记录已处理事件。`stop()`用`quiesce`/`resume`/`aflush`管理持久化边界。
- 测试代码。可以用同步接口在事件循环外直接操作。

### 3、它在管道里的位置

中继重发事件。BuzzChannel的`_handle_chat_event`先查`aseen`。已见过的事件直接丢弃。通过全部门控并成功发布的消息用`arecord`记录。管理器那层10分钟TTL的去重继续兜住进程内的重复。

## 四、重要性评级

评级：6分。

理由：本模块堵的是Buzz通道一个真实的重复回答漏洞。没有它，gateway重启或长间隔重连会对已回答的消息重新跑agent。这会直接骚扰用户并浪费算力。持久化、原子写、合并flush、取消保护这些机制都为这个目标服务。实现质量高，边界处理细致。但它的作用范围只限Buzz通道。去重只是去重，丢了数据也只是fail-open重放，不会造成安全问题。代码量不到400行。所以评6分：对Buzz体验重要，但范围和风险都有限。
