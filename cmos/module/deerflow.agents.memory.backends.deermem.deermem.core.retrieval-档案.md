# retrieval.py 档案

模块全名是deerflow.agents.memory.backends.deermem.deermem.core.retrieval。

源文件位置是backend/packages/harness/deerflow/agents/memory/backends/deermem/deermem/core/retrieval.py。

文件有704行。

## 一、这个模块是干什么的

这个模块是DeerMem的FTS5检索引擎。

FTS5是SQLite的全文本搜索扩展。

它提供BM25全文搜索。

BM25是一种按词频打分的经典检索算法。

它支持的能力包括：

- jieba中文分词（可选，回退到空格切分）。
- FTS5的MATCH语法（AND/OR/NOT/短语/前缀），带回退。
- 时间衰减加置信度加权的排序。
- 类别过滤。
- 作用域（user_id）隔离。

模块有两个核心类。

FTS5Retrieval是底层SQLite引擎。

FTS5RetrievalAdapter是存储集成层。

适配器实现storage.RetrievalPort。

适配器不导入storage模块。

不导入是为了避免循环依赖。

## 二、排序权重的关键背景

注释里记录了一个重要教训。

SQLite的bm25函数带位置参数。

位置参数的顺序是(表, k1, b, 各列权重)。

原始代码传了bm25(..., 0.0, 0.0, 1.0, ...)。

这把k1设成了0。

k1为0静默清零了整个BM25分数。

BM25失效。

排序退化成confidence乘0.2。

修复后的代码用无参形式bm25(memory_fts)。

无参形式让SQLite默认值生效。

SQLite默认K1是1.2、B是0.75。

BM25真正参与打分。

_CONFIDENCE_WEIGHT常量是0.2。

## 三、FTS5Retrieval类

（一）构造和线程安全

FTS5Retrieval构造时打开SQLite连接。

Gateway通过asyncio.to_thread和线程池跑工具调用。

SQLite连接不能跨线程共享。

所以它有两个防御层。

第一层是check_same_thread=False。让线程A创建的连接能被线程B访问。

第二层是_lock互斥锁。所有SQLite变更调用都经过这把锁串行化。

防止交错的写入和FTS5索引重排。

连接还设置WAL日志模式和30秒busy_timeout。

（二）索引操作

index_fact插入或更新一个事实。

先删同id的行再插入。

remove_fact从索引删除一个事实。

clear_index清空整个索引。

clear_scope清一个精确适配器作用域，不影响其他用户。

replace_documents在一个事务里原子替换全部或选定作用域的行。

用BEGIN IMMEDIATE开始事务，失败回滚。

rebuild_from_facts从事实字典列表重建整个索引。

（三）search方法

search是FTS5的BM25搜索。

查询策略分四层。

- 第一层：高级FTS5语法直接传给MATCH。
- 第二层：自然语言用jieba分词加OR拼接。
- 第三层：语法错误回退到分词OR查询。
- 第四层：还是失败就返回空。

_is_advanced_query用正则检测高级语法。

高级语法包括AND、OR、NOT、NEAR、短语、前缀、分组。

_build_fallback_query把自然语言转成FTS5的OR查询。

每个词元加双引号。

加引号让自然语言里的标点不能变成FTS5操作符或语法错误。

词元内的双引号用FTS5的转义（双写）。

（四）_execute_search方法

_execute_search执行FTS5查询。

语法错误返回None。

WHERE子句拼接scope_user、scope_agent、category条件。

每列取top_k乘2的候选。

对每行计算最终分。

fact_json解码成字典，decode失败用默认字段。

结果按最终分降序，取top_k。

（五）_compute_final_score方法

最终分是BM25分乘时间衰减加confidence权重。

FTS5返回负值，调用方先取负变成正的相关性量级。

时间衰减规则是30天内不衰减。

30天后按指数衰减，衰减率0.01。

创建时间解析失败时跳过衰减。

confidence解析失败默认0.5。

（六）stats和close方法

stats返回索引统计（总文档数、jieba可用性、数据库路径）。

close关闭连接。

## 四、FTS5RetrievalAdapter类

（一）作用域感知

适配器是作用域感知的RetrievalPort。

索引是派生数据。

规范事实留在Markdown里。

存储通知只更新被寻址的行。

复合文档id防止两个用户作用域里相同的fact id互相覆盖。

_document_id把scope_user、scope_agent、fact_id编码成JSON数组字符串。

_scope_value把None编码成json字符串。

这样None不会和用户id撞车。

（二）主要方法

upsert插入或更新一个事实到索引。

path参数被丢弃。

规范位置属于storage。

索引是可重建的。

rebuild原子替换存储方重建选中的记录。

remove从索引删除。

search对多个作用域搜索。

每个作用域取top_k乘4的候选。

应用filters过滤。

结果按分数降序返回top_k。

mode只接受hybrid、fts5、lexical三种。

其他值抛ValueError。

clear按作用域清空。

（三）_document方法

_document把事实字典变成索引文档。

fact_id和content必须是合法的非空字符串。

否则抛ValueError。

payload带上scope。

confidence缺失默认0.5。

0.0是storage._normalize_fact接受的持久化值。

只有缺失或null才默认0.5。

## 五、create_fts5_retrieval工厂

工厂构建DeerMem内置的适配器。

用持久化的派生索引。

storage_path有值时，索引目录是storage_path下的.retrieval/。

索引文件是memory-fts5.sqlite3。

storage_path为空时用内存索引。

独立的DeerMem实例没有配置存储根时用内存索引。

宿主工厂总是注入绝对存储根。

所以正常Gateway实例把可重建索引持久化在存储根下。

数据库损坏时删掉重建一次。

删除包括主文件、-wal、-shm三个文件。

重建再失败就退回子串检索。

索引目录不存在时创建。

## 六、它和谁协作

（一）它依赖谁

它依赖sqlite3、json、re、math、threading。

可选依赖jieba。

（二）谁调用它

storage.py的create_storage工厂通过config.retrieval_adapter=fts5走到create_fts5_retrieval。

storage.py的FileMemoryStorage持有适配器实例。

storage通过RetrievalPort协议调用upsert、remove、search、clear、rebuild。

存储在释放持久化锁之后才发送适配器更新。

适配器失败把作用域标记为脏。

脏作用域的搜索改用规范子串匹配直到重建成功。

DeerMem默认选择持久化SQLite FTS5。

空配置值选择子串回退。

Gateway启动调度warm_retrieval但不延迟就绪。

Gateway关机等一秒给检索预热。

然后关闭派生的SQLite连接。

（三）相关测试

SQLite索引数据在.retrieval/下且可重建。

坏的fact在重建时记日志跳过。

致命的重建失败保持惰性重试活跃。

损坏的持久化数据库删掉重建一次。

## 七、设计意图

这个模块体现三个设计。

第一个设计是索引是派生数据。

规范事实永远在Markdown文件里。

索引可以随时重建。

索引坏了不丢数据。

第二个设计是作用域隔离。

复合文档id保证不同用户的作用域互不干扰。

_scope_value编码None避免撞车。

clear_scope只清一个作用域。

第三个设计是多层回退。

查询语法高级语法失败回退到分词OR。

jieba缺失回退到空格切分。

持久化数据库损坏回退到重建。

重建失败回退到子串检索。

SQLite不可用回退到无适配器（子串匹配）。

## 重要性评级

评级是7分（满分10分）。

理由如下。

这个模块是DeerMem记忆检索的主引擎。

默认配置是FTS5。

所有memory_search的默认路径都经过它。

BM25加时间衰减加置信度的排序决定检索质量。

作用域隔离防止跨用户数据泄漏。

多层回退保证任何单点故障不中断检索。

线程安全设计防止并发写损坏索引。

它的教训记录有警示价值。

k1为0的bug曾让BM25静默失效。

它只影响检索，不影响存储。

检索是可重建的派生数据。

损坏不丢数据。

所以评级低于存储层。

综合来看，它是记忆系统的关键检索组件。

评7分。
