# FTS5Retrieval档案

源文件位置：backend/packages/harness/deerflow/agents/memory/backends/deermem/deermem/core/retrieval.py

## 一、这个类是干什么的

这个类是DeerMem记忆库的底层检索引擎。

这个类基于SQLite的FTS5全文检索。这个类对存储的事实做BM25全文搜索。事实的规范存储在Markdown文件里。检索索引是从Markdown派生出来的数据。索引坏了可以重建。

这个类的查询策略分几层。第一层是高级FTS5语法。高级语法直接传给MATCH。第二层是自然语言查询。自然语言先分词。然后各词用OR连接。第三层是语法错误时退回分词OR查询。第四层是仍然失败就返回空。

中文分词用jieba。jieba是可选依赖。没有jieba时退回空白符切分。

排序公式是BM25分数乘以时间衰减加上置信度权重。类别过滤和用户范围隔离都支持。

## 二、类的成员

### （一）字段

- _db_path：SQLite数据库路径。默认是内存数据库。正常Gateway实例会把索引持久化到存储根目录下的.retrieval目录。
- _conn：SQLite连接。这个连接用check_same_thread=False创建。这个设置让跨线程访问成为可能。
- _lock：线程锁。SQLite连接不能安全地跨线程共享。这把锁串行化所有变更调用。这防止写入交错和FTS5索引重排。

### （二）主要方法

- index_fact：插入或更新一条事实到FTS5索引。先删旧条目再插入。
- replace_documents：在一个事务里原子替换全部或选中范围的行。这个方法服务于原子重建。
- remove_fact：从索引删除一条事实。
- clear_index：清空整个索引。
- clear_scope：清空一个精确的适配器范围。清空不影响其他用户。
- rebuild_from_facts：从事实字典列表重建整个索引。
- search：FTS5的BM25搜索。支持类别和范围过滤。返回按相关性排序的事实字典列表。
- _execute_search：执行FTS5查询。语法错误时返回None。
- _compute_final_score：计算综合得分。综合得分是BM25乘以时间衰减加置信度权重。30天内不衰减。30天后按指数衰减。解析失败的分数跳过衰减。
- _preprocess_content：为索引预处理内容。有jieba时先分词再拼接。没有jieba时原样返回。
- stats：返回索引统计信息。统计包括文档总数、jieba是否可用、数据库路径。
- close：关闭数据库连接。

## 三、它和谁协作

- FTS5RetrievalAdapter是它的直接持有者。适配器在内部创建并持有这个引擎。适配器负责范围编码和文档ID组合。引擎只管SQL和检索。
- create_fts5_retrieval工厂函数负责构造适配器。适配器再构造这个引擎。
- FileMemoryStorage通过RetrievalPort协议间接调用这个引擎。存储层发送更新通知，适配器转发给引擎。
- jieba是可选的分词依赖。安装memory-zh扩展后才可用。
- SQLite是它的底层存储。FTS5虚拟表memory_fts是唯一的数据表。

## 四、重要性评级

评级：8分。

理由：这个类是记忆检索的核心引擎。没有这个类，记忆检索会退回到慢速子串匹配。这个类承载了BM25打分、时间衰减、中文分词等关键检索逻辑。这个类的并发锁设计也很关键。SQLite连接的线程安全问题靠这把锁解决。但是索引是可重建的派生数据。索引丢失不丢失记忆本体。所以这个类不是最顶层的关键。
