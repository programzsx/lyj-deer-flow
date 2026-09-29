# app.channels.dedupe_store 档案

## 一、这个模块是干什么的

dedupe_store.py是入站webhook的去重存储。

它守护agent运行和最终回复，防住消息平台的重复投递。

问题来源是这样的。消息平台有时会把同一条消息投递两次。没有去重的话，同一条消息会触发两次agent运行、发出两份回复。管理器层的入站去重（`ChannelManager._inbound_dedupe_key`）就是做这个防护的。本模块给这个防护提供存储。

默认存储是进程内的`OrderedDict`。这是向后兼容的单pod行为。多pod部署时可以注入共享存储（比如Postgres）。这样落在另一个pod上的重复投递也能被识别并丢弃。这个能力来自issue #4120。

## 二、模块里的主要成员

### 1、常量与协议

- `INBOUND_DEDUPE_TTL_SECONDS`（600秒，即10分钟）。去重条目的存活时间。
- `INBOUND_DEDUPE_MAX_ENTRIES`（4096）。内存存储的条目容量上限。
- `InboundDedupeKey`。去重键的四元组类型。内容是`(channel_name, workspace_id, chat_id, message_id)`。与管理器的`_inbound_dedupe_key`保持一致。
- `InboundDedupeStore`。异步协议（Protocol）。定义两个方法。`try_record(key)`返回True表示键已存在（重复，丢弃），返回False表示新记录或已过期（放行）。`release(key)`释放键。共享存储实现必须保证原子性。

### 2、MemoryInboundDedupeStore类

进程内的`OrderedDict`存储。原样保留#4120之前的行为。

- `__init__(ttl_seconds, max_entries)`。持有TTL和容量上限。
- `try_record(key)`。先清理再检查。`OrderedDict`的插入顺序就是时间顺序。键从不重插。过期条目聚在前面。所以从头弹出直到遇到还活着的条目，代价是O(k)，不用每次全表扫描。容量超限也从头部弹。然后检查键是否存在。存在返回True（重复）。不存在记录当前时间并返回False。
- `release(key)`。直接弹出键。

### 3、PostgresInboundDedupeStore类

共享的Postgres去重存储。一条投递对应一行。键就是四元组。落到另一个gateway pod的重复投递会命中同一张表。

- `__init__(session_factory)`。测试时注入。否则从应用引擎惰性解析。
- `_resolve_session_factory()`。解析SQLAlchemy的session工厂。解析不到抛`RuntimeError`。
- `try_record(key)`。核心是一条原子条件upsert。语句是`INSERT ... ON CONFLICT DO UPDATE SET first_seen = now() WHERE first_seen < now() - TTL RETURNING channel`。三种结果。无冲突则插入新行，放行。冲突但行已过期则刷新`first_seen`并返回行，放行。冲突且行还活着则WHERE失败，无行返回，按重复丢弃。单条行锁语句没有TOCTOU窗口。两个pod竞争同一个过期键不可能都放行。RETURNING而不是rowcount，因为rowcount在ON CONFLICT下的可靠性因驱动而异。放行路径顺带在同一事务里做惰性清理，删除超过TTL的旧行。这样清理被摊销进正常入站流量，不需要后台任务。
- `release(key)`。删除对应行。
- 失败策略是fail-open。任何数据库错误被记日志并按"放行"处理。存储故障绝不丢消息，也绝不给平台返回5xx。最多出现重复，绝不出现静默丢失。

### 4、工厂函数

- `make_inbound_dedupe_store(app_config)`。按配置解析存储。`memory`选进程内存储。`postgres`选共享Postgres存储，要求应用数据库是Postgres，否则降级到内存存储并打WARNING。`auto`（默认）在应用数据库是Postgres时选共享Postgres存储，否则选内存存储。多worker或多副本部署无法用共享存储时打WARNING。这让跨pod去重缺口成为显式的配置错误，而不是静默的默认行为。
- `_gateway_workers()`。读`GATEWAY_WORKERS`环境变量。镜像deps模块的多worker检测。
- `_build_postgres_store()`。构建共享Postgres存储。

## 三、它和谁协作

### 1、它依赖谁

- Python标准库的`collections`、`time`、`os`。
- SQLAlchemy的`text`。Postgres存储用原生SQL。
- `deerflow.persistence.engine.get_session_factory`。惰性解析应用数据库会话工厂。这是唯一对app内其他模块的依赖。

### 2、谁调用它

- `app.channels.manager.ChannelManager`。管理器消费入站消息前用本模块检查去重键。发布最终回复后调用`release`释放键，让失败后的平台重投递能重试。
- `app.channels.service`。通过`make_inbound_dedupe_store`在启动时构建存储并注入管理器。
- `app.py`或配置装配层。调用工厂函数解析配置。

### 3、数据库表

Postgres存储使用`webhook_deliveries`表。表的主键是四元组`(channel, workspace_id, chat_id, message_id)`。

## 四、重要性评级

评级：7分。

理由：本模块是全部IM通道入站消息的统一去重层。没有它，消息平台的重复投递会触发重复的agent运行。这会骚扰用户、浪费算力、还可能在群聊里刷屏。它的设计覆盖了单pod和多pod两种部署形态。Postgres变体的条件upsert是正确的并发设计，没有TOCTOU窗口。fail-open策略保证了存储故障不丢消息。工厂函数把配置错误显式暴露为WARNING。这些都是高质量的基础设施设计。但它本身逻辑不复杂，代码量不到300行。它是被manager.py消费的底层组件，不是决策层。所以评7分：被所有IM通道依赖的基础设施，可靠性设计很关键，但自身规模小。
