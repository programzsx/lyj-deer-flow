# deerflow.runtime.events.store-档案

## 一、这个包是干什么的

这个包是DeerFlow的"运行事件存储"包。

包名是`deerflow.runtime.events.store`。源码在`backend/packages/harness/deerflow/runtime/events/store/`。

大白话讲。每次运行产生的事件要持久化。这个包定义事件存储的统一接口。消息（前端展示用）和执行追踪（调试审计用）走同一个接口。用`category`字段区分。

提供三种后端实现。

- `MemoryRunEventStore`。内存字典。默认后端。给开发和测试用。
- `DbRunEventStore`。SQLAlchemy ORM实现。持久化到`run_events`表。给生产用。
- `JsonlRunEventStore`。JSONL文件实现。每个运行一个文件。给轻量单机部署用。

这个包是线程feed的源头。前端的消息列表、子任务卡片、运行历史。最终都从这个包的某个后端读出来。

## 二、包里的主要成员

### 1、__init__.py（工厂）

它定义`make_run_event_store()`工厂。按`run_events.backend`配置创建存储。

- `memory`或无配置。返回`MemoryRunEventStore`。
- `db`。从`deerflow.persistence.engine`拿会话工厂。拿不到时回退到memory（database.backend是memory但run_events.backend是db的情况）。拿到时返回`DbRunEventStore`。
- `jsonl`。返回`JsonlRunEventStore`。
- 其他值抛`ValueError`。

### 2、base.py（抽象接口）

`RunEventStore`是抽象基类。docstring列出了所有实现必须保证的六条契约。

- `put()`写入的事件在后续查询可取。
- seq在同一线程内严格递增。
- `list_messages()`只返回`category="message"`的事件。
- `list_events()`返回指定运行的全部事件。
- 返回的字典带完整的RunEvent信封字段。后端可以加文档化的字段（比如`DbRunEventStore`的`user_id`）。
- `find_latest_ai_message_run_ids()`对每个请求的id返回最新的有效AI消息事件。空输入不做存储工作。

抽象方法包括。

- `put()`。写单个事件。自动分配seq。返回完整记录。低频路径。
- `put_batch()`。批量写。`RunJournal`的flush缓冲用这个。
- `put_if_absent()`。除非这个运行已有同类型事件才写。检查和写必须和普通写串行化。这是终态运行回执的持久化原语。恢复路径崩溃后可以安全重试。
- `list_messages()`。线程的可见消息。seq升序。支持双向游标分页。`before_seq`取之前的。`after_seq`取之后的。都不传取最新的。
- `find_latest_ai_message_run_ids()`。把目标消息id映射到最新有效AI事件的run_id。默认实现按1000行的页向后翻页。保留第一页的高水位。通过排他的`before_seq`游标。整页没有安全递进的seq时抛`IncompleteMessageRunLookupError`。调用方只能在普通返回后把缺失当作穷尽查找的结果。这是"改运行发现"和"定向事件归因"的底层。memory和database store用这个有界路径。
- `list_events()`。一个运行的完整事件流。可按`event_types`和`task_id`过滤。`after_seq`是前进游标。让调用方翻单个子代理任务的事件。不被运行范围的limit截断（issue #3779）。
- `list_messages_by_run()`、`get_last_visible_ai_seq_by_run()`、`count_messages()`、`get_message_seqs()`。运行级消息、运行末条AI seq、消息计数、身份到seq的映射。
- `delete_by_thread()`和`delete_by_run()`。删除。返回删除数。`user_id`遵循三态约定。`AUTO`解析调用方上下文。显式id限定属主。None删所有属主的行。非用户范围的存储（memory、JSONL）收下参数保证接口一致。忽略它。

模块级辅助。`normalize_message_ids()`过滤出非空字符串id。`match_ai_message_run_id()`匹配目标AI消息id和有效run_id。两个路径共享。

### 3、db.py（SQLAlchemy实现）

`DbRunEventStore`。生产后端。文件约2.7万字节。持久化到`run_events`表。

并发控制是核心设计。

- 进程内。每个线程一把`asyncio.Lock`。串行化seq分配。两个协程在max(seq)读取和INSERT之间交错会撞seq。锁防这个。
- 跨进程。PostgreSQL用事务级advisory lock。键是`thread_id`的哈希。`_acquire_thread_mutation_fence()`在碰行之前先拿。SQLite没有跨进程fence。靠进程内锁。Postgres拒绝`SELECT max(...) FOR UPDATE`。因为聚合结果不是可锁的行。所以Postgres走advisory lock。其他方言保留行锁语句。
- 锁注册表用弱引用加pin。弱注册表在已准入的持有者或等待者还引用时保留一代锁。单独的pin保持"每个活线程一把锁"的历史行为。直到`delete_by_thread()`显式退役该线程。退役后未完成的调用者单独让那代锁活到排空。删除时故意不从弱注册表直接移除条目。`asyncio.Lock.release()`在排队的等待者恢复前就清掉`locked()`。解锁检查可能观察到交接窗口。把一个线程劈到两代锁上。
- 这是序列化契约。不是 incarnation fence。删除前已准入的变更之后仍可能运行。防止旧 incarnation 复活需要另外的持久代际契约。

写路径。

- `put()`。低频路径。开专用事务。唯一的调用方是`worker.run_agent`写初始human_message事件。每个运行一次。
- `put_batch()`。高频路径。整批拿一次锁。要求全部事件同线程。批量分配seq。
- `put_if_absent()`。幂等插入运行范围的单例事件。存在检查拿同样的锁。终态投递回执在worker和恢复两条路径都用它。

读路径。

- `list_messages()`。category是message的行。双向游标分页。前进分页取游标后第一条。向后分页取降序limit后反转返回升序。
- `list_events()`。可按event_types和task_id过滤。task_id在SQL里过滤（LIMIT之前）。让单个子代理任务的游标分页保持正确（issue #3779）。JSON探针只跑这个运行的小候选集。
- `get_last_visible_ai_seq_by_run()`。每个运行的最后一条非中间件AI消息seq。排除`caller`像`middleware:%`的行。
- `get_message_seqs()`。身份到seq的映射。`content`是TEXT列存的JSON字符串。不是JSON列。所以身份字段不能在SQL里投影。匹配行在这里解码。带LIKE预过滤。身份是`kind:raw_id`。原始id原样出现在存储的JSON字符串里。不含任何wanted id的行不可能解析任何wanted身份。预过滤把成本留在SQL里。误报由`message_identity`复核。预过滤器表达不了的id（json.dumps会转义的字符）整组回退到全扫描。最早seq赢。重新持久化的消息保持第一次占据的位置。找齐后提前结束扫描。
- 两个删除方法在同一个线程变更临界区里跑。删除不能和已准入的写交错。不能为已删线程重建行。

其他细节。

- 追踪内容在`max_trace_content`字节处截断。避免撑爆数据库。按字节截断再解码。标记`content_truncated`和原始字节长度。
- 内容是字典时JSON序列化进content列。标记`content_is_json`和`content_is_dict`。读取时还原结构化内容。
- 用户id软读。写路径从contextvar读。未设置时返回None。后台worker写入的预期情况。HTTP请求写入由auth中间件设置contextvar。自动盖上user_id。`user.id`在边界强制转str。aiosqlite不能把裸UUID对象绑到VARCHAR列。否则INSERT静默回滚。worker会挂起。
- 时间戳。SQLite读回来丢tzinfo。`coerce_iso`把naive时间规范成UTC。

### 4、jsonl.py（JSONL文件实现）

`JsonlRunEventStore`。每个运行的事件存一个文件。路径是`.deer-flow/threads/{thread_id}/runs/{run_id}.jsonl`。所有分类在同一个文件里。

关键约束写在docstring里。

- 单进程保证。内存seq计数器是进程本地的。多进程部署共享同一目录会产生重复或非单调的seq。多进程或高并发部署用`DbRunEventStore`。
- 文件IO通过`asyncio.to_thread`卸载到线程池。事件循环永不阻塞。
- 每线程`asyncio.Lock`串行化写。防止JSONL行交错。
- 已知取舍。`list_messages()`必须扫描线程的全部运行文件。因为多个运行的消息要统一seq排序。`list_events()`只读一个文件。这是快路径。

记录边界规则。线程读、运行读、seq恢复按物理换行拆分。不用`str.splitlines()`。因为U+0085/U+2028/U+2029在合法JSON字符串里必须留在记录内。`read_text`在LF拆分前规范CRLF。`tests/test_jsonl_event_store_unicode.py`覆盖Unicode值、重开、幂等写、LF/CRLF、空行、畸形记录。

变更串行化。`_run_mutation()`先拿每线程锁。然后排空被shield的操作。穿越文件IO、回滚、seq和锁记账。最后释放锁或重新抛调用方取消。重复取消不能甩掉活动中的磁盘worker。失败的变更保持为传播的取消的原因。故意没有排空超时。在worker还能改文件时释放所有权。会让写者进入本应稳定的快照。排空任务命名为`jsonl-mutation:{thread_id}`方便asyncio任务转储。回归覆盖在`tests/test_jsonl_event_store_cancellation.py`。

定向归因覆盖。JSONL store重写`find_latest_ai_message_run_ids()`。用一次完整的线程日志读。因为每个JSONL分页会重扫每个运行文件。快照任务命名为`jsonl-snapshot:{thread_id}`。持有每线程锁直到off-thread完整日志读落定。即使调用方取消也如此。故意没有排空超时。原因同上。

其他。id和thread_id验证文件系统安全。`_SAFE_ID_PATTERN`只允许字母数字下划线连字符。`find_latest_ai_message_run_ids`的JSONL快照任务持有锁。多线程`put_batch`取消时排空当前组。不启动后面的组。已准入的组成功保留记录。失败完成回滚。

### 5、memory.py（内存实现）

`MemoryRunEventStore`。默认后端。

- 核心数据。`_events`是thread_id到seq排序事件列表。`_messages`是消息投影。共享字典对象。不复制。
- 两个run范围的投影。`_events_by_run`和`_messages_by_run`。单运行读取代价是O(运行内事件数)。不是O(线程内事件数)。没有这些。`list_events`和`list_messages_by_run`每次请求都重扫整个线程的事件日志。这是线程范围`_messages`投影的单运行版本。
- 消息分页用bisect。O(log m + 页)。
- `put_if_absent()`。查找和插入之间没有await。所以对文档化的单事件循环并发模型是原子的。
- 单进程单事件循环线程安全。不需要线程锁。

## 三、它和谁协作

### 1、上游

- `deerflow.persistence`。`engine`提供会话工厂。`models.run_event.RunEventRow`是ORM行。
- `deerflow.runtime.user_context`。`AUTO`哨兵和`resolve_user_id`。三态用户隔离。
- `deerflow.runtime.events.message_identity`。`message_identity()`用于身份解析。
- `deerflow.utils`。`coerce_iso`时间规范。`validate_thread_id`路径安全。

### 2、下游（被谁用）

全仓库搜索`from deerflow.runtime.events.store`的导入引用有115处（不含runtime自身）。引用文件包括。

- `backend/packages/harness/deerflow/runtime/journal.py`。最大写入方。flush缓冲调`put_batch`。
- `backend/packages/harness/deerflow/runtime/runs/worker.py`和`manager.py`。终态回执、子代理事件缓冲、投递回执。
- `backend/app/gateway/routers/threads.py`和`services.py`。REST消息分页、事件查询。
- `backend/packages/harness/deerflow/agents/middlewares/`。中间件生产事件时用到store契约。
- `backend/packages/harness/deerflow/subagents/step_events.py`。子代理事件写入。
- 多个测试文件。`test_jsonl_event_store_unicode.py`、`test_jsonl_event_store_cancellation.py`等。

### 3、依赖方向

这个包属于harness层。不导入app层。db后端依赖`deerflow.persistence`（更底层）。这符合分层。persistence读runtime的`user_context`。runtime的store用persistence的会话工厂。

## 四、重要性评级

评级是8分。

理由如下。

这个包是线程消息流的唯一持久化层。前端展示的每一条消息。每一个工具结果。每一个子代理步骤。都存在这个包的某个后端里。

它被引用的地方多。全仓库导入引用有115处。journal、worker、manager、gateway路由、中间件、子代理都在用。写路径和读路径都是产品主干。

它是核心路径。默认memory后端在默认开发环境参与运行。生产配置的db后端在Gateway每个请求上参与运行。消息分页、运行历史、子任务卡片全部依赖它。

删除它会怎样。journal无法落事件。前端消息列表完全消失。运行历史、子任务卡片、终态回执全部失效。Gateway启动时工厂导入失败。直接无法启动。

为什么是8分不是更高分。抽象接口的多个实现可以互换。默认后端是内存的。重启即丢。真正持久化的部署才依赖db后端。它没有运行编排和检查点安全那样的不可替代复杂度。删除它主要是展示层失效。核心的智能体循环仍能跑（没有事件流）。

为什么不是更低分。它是前端数据链路的源头。并发控制（advisory lock、弱锁注册表、变更fence）和幂等回执是生产正确性的关键。db.py的序列化契约和jsonl.py的取消排空都经过仔细设计。有专门的回归测试锁住。
