# FileMemoryStorage档案

源文件位置：backend/packages/harness/deerflow/agents/memory/backends/deermem/deermem/core/storage.py

## 一、这个类是干什么的

这个类是DeerMem记忆库的默认存储实现。

这个类继承自MemoryStorage抽象基类。这个类负责记忆的持久化落盘。

存储布局分两层。用户级摘要存在一个memory.json文件里。每条事实单独存在一个Markdown文件里。Markdown文件带YAML front matter。事实文件按智能体名字分目录。目录还按事实ID的sha256前缀分片。

这个类的职责包括几块。第一块是记忆的读写。第二块是事实的增删改查。第三块是版本迁移。第四块是检索适配。第五块是缓存管理。第六块是并发控制。

这个类的写入是安全的。写入使用用户锁、共享修订号、事实级修订号和恢复日志。写入是原子替换。POSIX文件系统下还会同步父目录。崩溃后恢复日志能把操作恢复回来。

## 二、类的成员

### （一）字段

- _config：DeerMem私有配置。
- _retrieval：可选的检索适配器。这个适配器实现了RetrievalPort协议。
- _memory_cache：内存缓存。缓存按（user_id，agent_name）键存文档和签名。
- _cache_lock：保护缓存的线程锁。
- _scope_locks：用户范围的锁。这是一个弱引用字典。不活跃的用户范围不能留在缓存里。
- _retrieval_dirty_scopes：检索索引脏标记集合。适配器更新失败时标记对应的范围。搜索先重建脏范围。

### （二）主要方法

- load：加载记忆文档。带缓存。加载前会完成日志恢复和迁移。签名匹配时直接返回缓存副本。
- reload：强制重新加载记忆文档。不走缓存。可以选择重建检索索引。
- save：兼容的全量替换接口。内部会diff成按事实的操作。提交时只写入新增、修改、删除的事实。
- apply_changes：提交增量变更集。只返回应用的变化量。返回值的complete字段固定为False。这个方法支持清单修订冲突后的有限重定基。
- upsert_fact：单条事实的新增或更新。底层走apply_changes。
- delete_fact：单条事实的删除。底层走apply_changes。
- get_fact：按ID读取一条事实。
- list_facts：列出事实。支持过滤、游标和分页。
- get_summaries：读取用户级摘要。
- update_summaries：更新用户级摘要。摘要永远是用户全局的。摘要不会按智能体隔离。
- migrate：对一个精确范围执行幂等的版本迁移。
- clear_all：清空一个用户的摘要和所有智能体的事实桶。清空会保留智能体配置。
- get_fact_usage：读取查询使用量侧车数据。这个数据用于容量打分。
- record_fact_accesses：记录实际的查询命中。命中会递增访问热度。
- record_capacity_eviction：持久化淘汰审计证据。审计只写元数据。
- clear_fact_metadata：删除选中事实的侧车数据。也可以删除整个范围。
- search_facts：搜索事实。配置了检索适配器时走适配器。脏范围先重建。重建失败时退回子串匹配。
- _search_substring：子串匹配的兜底搜索。
- rebuild_index：重建检索索引。支持全量重建和按范围重建。
- retrieval_status：返回检索状态。
- capabilities：返回存储能力集合。
- close：释放检索适配器资源。
- _commit_changes_locked：核心提交方法。只写入被寻址的事实文件加共享摘要JSON。提交前写恢复日志。提交后推进修订号。
- _recover_if_needed：恢复或清理之前日志化的多文件操作。
- _migrate_locked：合并旧版事实。合并不会覆盖已存在的规范事实。破坏性迁移前先备份源文件。

## 三、它和谁协作

- MemoryStorage是它的父类。父类定义了存储协议。
- MemoryUpdater是它的主要调用方。更新器通过注入拿到这个存储实例。
- FTS5RetrievalAdapter是它的检索适配器。适配器实现RetrievalPort协议。存储层在释放持久锁之后才发送适配器更新。
- create_storage工厂函数负责构造这个类。配置storage_class为file或缺省时返回这个类。
- MarkdownMemoryStorage继承这个类。子类只重写摘要加载逻辑。
- paths模块提供路径构建函数。
- eviction模块提供淘汰决策类型。

## 四、重要性评级

评级：9分。

理由：这个类是记忆后端的核心存储类。所有记忆数据最终都落在这个类管理的磁盘文件上。这个类实现了完整的事务语义。事务语义包括恢复日志、双重修订号、原子替换、跨进程锁。这个类还负责版本迁移和检索集成。这个类出问题，整个记忆系统就会丢数据。这个类是全项目最关键的记忆组件之一。
