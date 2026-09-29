# deerflow.runtime.events.store.db-档案

## 一、这个模块是干什么的

这个文件是运行事件存储的SQLAlchemy实现。

它把事件持久化到run_events表。

这是生产多进程部署用的后端。

trace内容有截断。截断上限是max_trace_content字节。默认10240。目的是避免撑大数据库。

## 二、模块里的主要成员

### 1、DbRunEventStore类

这个类继承RunEventStore。

#### （1）内部锁结构

它维护每线程的asyncio锁。用弱值字典持有。

锁的作用是串行化seq分配。同进程内两个协程可能交错在max(seq)读取和INSERT之间。没有锁它们会在seq上撞车。

数据库层的FOR UPDATE锁和PostgreSQL的advisory锁负责跨进程的竞争。这个锁负责常见的单进程情况。

弱注册表保留一个锁的世代。只要还有持有者或等待者引用它。删除线程时退掉活跃线程的pin。退掉之后 outstanding的使用者继续让这个世代存活。

#### （2）写入方法

put写单个事件。低频路径。它开专用事务。事务里用FOR UPDATE锁分配单调seq。当前唯一调用者是worker写初始human_message事件。每个run一次。

put_batch批量写。全部事件必须属于同一个线程。否则抛ValueError。它一次拿锁，读一次max seq，然后给整批事件连续分配seq。RunJournal的flush缓冲走这里。

put_if_absent幂等写入。它在同一个事务里先查存在性再插入。terminal投递回执在worker和恢复两条路径都用它。普通事件保持append-only。

#### （3）线程变更围栏

_acquire_thread_mutation_fence拿跨进程的线程变更围栏。

PostgreSQL上执行pg_advisory_xact_lock。键由thread_id哈希出来。这是事务级advisory锁。

SQLite上没有跨进程围栏。这个方法是空操作。SQLite靠进程内的每线程锁。

每一个线程变更，put、put_batch、put_if_absent、两个删除，都先拿这个围栏。

围栏保证了删除不可能和已准入的写入交错。写入不可能落在删除的计数和提交之间。

_max_seq_for_thread在拿围栏之后读max(seq)聚合。PostgreSQL上聚合结果不是可锁的行。所以用advisory锁。其他方言用WITH FOR UPDATE行锁。

#### （4）读取方法

list_messages支持双向游标分页。before_seq向前。after_seq向后。默认取最新limit条再反转成升序。user_id过滤在SQL里做。

list_events支持event_types和task_id过滤。task_id过滤用JSON探测在SQL里做。在LIMIT之前过滤。这样单个子代理任务的游标分页保持正确。这是编号3779的修复。

list_messages_by_run和list_messages类似。多一个run_id条件。

get_last_visible_ai_seq_by_run按run分组取最大seq。event_type限定llm.ai.response和ai_message。排除middleware调用者。用NOT LIKE。

count_messages做SQL计数。

get_message_seqs按身份查seq。content是TEXT列存JSON字符串。不是JSON列。所以身份字段不能在SQL里投影。匹配的行在Python里解码。它用LIKE预过滤。只有包含目标id作为原始子串的行才被取回。ids会被json.dumps转义的情况整组回退到全扫描。找到全部目标后提前结束。

#### （5）删除方法

delete_by_thread在线程变更围栏内删除全部事件。先计数再删除。删除后退掉活跃线程的pin。从不直接删弱注册表条目。因为asyncio.Lock的release先清locked()再唤醒等待者。解锁检查可能观察到交接窗口。这样会把一个线程拆到两个锁世代上。

delete_by_run共享同样的围栏。删单个run线程还活着。所以pin刻意保留。

#### （6）内容编解码

_content_to_db把结构化内容JSON序列化。在metadata里标记content_is_json和content_is_dict。

_row_to_dict读的时候按标记反序列化。解析失败保留原始字符串。

_truncate_trace按字节截断trace类内容。多字节字符可能被切断。用errors=ignore解码。metadata里记录content_truncated和原始字节长度。

_user_id_from_context从contextvar软读user_id。后台worker写入时contextvar未设置。返回None。HTTP请求写入会被自动盖戳。user.id是UUID。列是VARCHAR。aiosqlite不能绑定原始UUID对象。所以在这里强制转成str。不转的话INSERT静默回滚，worker会挂住。

## 三、它和谁协作

它继承runtime.events.store.base里的RunEventStore。

它依赖persistence.models.run_event里的RunEventRow。

它依赖runtime.events.message_identity里的message_identity。

它依赖runtime.user_context里的用户解析。

它是多进程生产部署的事件存储。

## 四、重要性评级

评级是9分。

理由是这个文件是生产环境的事件存储。

seq分配的进程内外双重串行化都在这里。

线程变更围栏保护删除不和写入交错。交错会复活已删除的线程。

LIKE预过滤保护了长线程的检查点读取性能。

user_id的UUID强转修复了一个真实的worker挂死问题。

不评10分是因为它的核心契约由base.py约束，它只是其中一个实现。
