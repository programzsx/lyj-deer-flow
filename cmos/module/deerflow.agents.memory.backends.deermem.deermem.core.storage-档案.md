# storage.py 档案

模块全名是deerflow.agents.memory.backends.deermem.deermem.core.storage。

源文件位置是backend/packages/harness/deerflow/agents/memory/backends/deermem/deermem/core/storage.py。

文件有1947行。

## 一、这个模块是干什么的

这个模块是DeerMem记忆的持久化存储层。

它是core包里最大、最重要的模块。

它管理两类持久化数据。

第一类是用户级的memory.json。

memory.json只存项目无关的用户和历史总结。

第二类是每个代理的事实文件。

每个事实是规范的、单独的Markdown文件。

Markdown文件带YAML front matter。

事实存在代理名目录下，按id哈希分片。

事实永远不会作为索引写进memory.json。

memory.json里永远没有事实，也没有事实索引。

模块提供公开的load和save兼容接口。

接口保留历史的文档形状（facts是一个列表）。

这样updater和Gateway调用方可以逐步迁移到事实仓储API。

## 二、错误类型体系

模块定义了一组类型化的错误类。

- MemoryStorageError是持久化记忆失败的基类。
- MemoryStorageCorruption表示全局memory.json或规范事实无法安全解析。
- MemoryRevisionConflict表示过期的写者试图覆盖更新的修订。
- MemoryManifestRevisionConflict表示共享修订在事务提交前变了。
- MemoryFactRevisionConflict表示事实不再满足它的预期缺失或修订。

用类型化冲突类。

不要匹配异常文本来判断冲突。

上层调用方靠这些类型做重试和降级。

DeerMem把存储冲突转换成公开的MemoryManager错误类型。

Gateway把冲突映射成HTTP 409。

Gateway把存储损坏映射成稳定的HTTP 500。

## 三、文档形状与归一化

（一）create_empty_memory函数

create_empty_memory返回兼容的文档形状。

形状包含version、revision、lastUpdated。

包含user节（workContext、personalContext、topOfMind、cognitiveStyle）。

包含history节（recentMonths、earlierContext、longTermBackground）。

包含空的facts列表。

（二）normalize_memory_data函数

normalize_memory_data返回规范的兼容文档。

它不修改调用方的输入。

它做加法式归一化。

摘要小节用_normalize_context_section归一化。

归一化保留扩展字段。

legacy导入事实用_normalize_legacy_import_fact归一化。

归一化规则是中性confidence 0.5给缺失或无效值。

有限confidence压到[0,1]。

内容trim。

空或缺失source默认unknown。

这些兼容默认值必须和前端的import-memory.ts保持对齐。

（三）_normalize_fact函数

_normalize_fact校验单个事实并推导它自己的修订号。

这是整个存储层最核心的校验函数。

它的规则很多。

- id必须是字母数字下划线连字符。缺失时生成fact_加uuid。
- schemaVersion设为2。
- content必须是字符串，trim后非空。
- category必须在CORE_CATEGORIES集合里。不在的类别进categoryExtension，category改为other。
- CORE_CATEGORIES包含preference、correction、context、goal、behavior、cognitive、identity、constraint、decision、other。
- confidence必须是0到1之间的数字。布尔拒绝。
- status必须是active。删除是物理删除。
- scope是用户和代理的字典。
- topics和consolidatedFrom必须是字符串列表。
- revision必须是大于等于1的整数。
- source归一化成{type, threadId}形式。字符串形式的manual、consolidation、import、unknown映射到type。其他字符串映射到type为conversation、threadId为该字符串。
- title从显式title或内容首行推导，上限160字符。

修订推导分两种情况。

existing为None时是新事实。设置createdAt和updatedAt。

existing存在时是更新。预期修订和存量修订不匹配抛MemoryFactRevisionConflict。

内容材料没变时保持原修订号和原updatedAt。

内容材料变了时修订号加1，updatedAt更新为现在。

## 四、磁盘布局与原子写入

（一）规范事实的渲染和解析

_render_fact_markdown把事实渲染成Markdown字节。

front matter用yaml.safe_dump。

正文是标题加内容。

_parse_fact_markdown从Markdown解析回事实。

解析失败抛MemoryStorageCorruption。

（二）原子写入

_atomic_write是原子替换函数。

流程是写临时文件、flush、fsync、rename替换、fsync父目录。

POSIX原子替换必须同步父目录。

Windows跳过父目录同步。

（三）跨进程文件锁

_process_file_lock是一个作用域的跨进程建议锁。

只用标准库实现。

Windows用msvcrt.locking。

POSIX用fcntl.flock。

锁获取带超时。超时抛TimeoutError。

写操作使用用户锁、共享修订、事实修订、恢复日志。

（四）路径安全

_safe_relative_path解析不可信的持久化相对路径。

解析不能离开根目录。

绝对路径拒绝。

逃逸根目录抛MemoryStorageCorruption。

## 五、FileMemoryStorage类

这是核心存储类。

（一）缓存设计

实例维护_memory_cache。

缓存键是(user_id, agent_name)。

缓存值是文档和签名元组。

签名用纳秒mtime加文件大小加共享修订号。

纳秒mtime让缓存校验不只看mtime。

包含共享修订防止粗粒度mtime文件系统上两次同大小写入的假命中。

作用域锁用WeakValueDictionary。

弱锁缓存不能保留不活跃的用户作用域。

缓存校验用manifest元数据和持久化修订。

带外的Markdown编辑需要reload()。

（二）检索通知

_dispatch_retrieval_notifications在持久化存储锁释放后通知索引。

通知失败把作用域标记为脏。

脏作用域的搜索退回子串匹配直到重建成功。

（三）load方法

load是主读取入口。

流程分几步。

第一步判断是否需要迁移。需要迁移的条件是恢复日志存在、legacy路径存在、全局JSON需要迁移、或者默认桶的lead-agent旧目录存在。

第二步需要迁移时，加锁运行_run_read_migrations_locked。

第三步分发迁移产生的检索通知。

第四步检查缓存。签名匹配时返回深拷贝。

第五步读文档并填充缓存。

（四）reload方法

reload绕过缓存直接读文档。

还重建指定作用域的检索索引。

带外编辑后必须调用reload。

（五）_commit_changes_locked方法

这是多文件事务的提交核心。

它只提交被寻址的事实文件加共享的总结JSON。

它刻意不是load-all/replace-all。

未变化的事实文件既不备份也不重写也不重建索引。

流程如下。

第一步检查预期修订。不匹配抛MemoryManifestRevisionConflict。

第二步处理upserts。逐个读取现有事实，校验预期事实修订，归一化。

第三步处理deletes。检查删除预期修订。

第四步写恢复日志。

恢复日志是.memory.journal.json。

恢复目录是.recovery/{操作id}。

日志先写prepared状态。

备份当前manifest和所有旧事实文件到恢复目录。

第五步执行写入。写事实Markdown、删除被寻址的事实、写manifest。

第六步把日志改成committed状态。

最后清理恢复目录和日志文件。

 Seventh步清掉该用户的所有缓存。

（六）_recover_if_needed方法

_recover_if_needed恢复或清理之前日志化的多文件操作。

prepared状态时恢复备份。

manifest备份存在就恢复manifest。

expectedRevision为0时删除manifest。

恢复旧事实文件。

committed状态时只清理。

未知状态抛MemoryStorageCorruption。

## 六、公开API

（一）apply_changes方法

apply_changes提交增量变更集。

返回值带complete: false和事实增量。

complete故意是false。

调用方的响应契约需要完整文档时必须显式调用load。

这防止新进程把单事实缓存快照当成完整记忆。

变更集包含upserts、deletes、summaries、deleteRevisions、upsertRevisions。

有manifest冲突时的rebase规则如下。

allow_manifest_rebase开启且有事实变更、无总结变更、所有删除和upsert都有预期修订时才允许rebase。

rebase最多重试2次。

rebase从磁盘读当前修订重试。

所有原始事实前置条件仍然成立时点操作才能rebase。

（二）upsert_fact和delete_fact方法

upsert_fact和delete_fact是单事实的便捷封装。

内部走apply_changes，allow_manifest_rebase开启。

（三）save方法

save是兼容的整文档替换。

它要扫描选中的代理来确定哪些被省略的事实是删除。

但提交只写新的、变化的、被删除的事实。

仓储调用方应该优先用apply_changes避免整文档比较扫描。

（四）get_fact、list_facts、get_summaries、update_summaries

get_fact读单个事实。agent_name必填。

list_facts带过滤、游标、分页。

get_summaries读总结。

update_summaries更新总结。

总结永远用户全局，从不代理特定。

（五）clear_all方法

clear_all清一个用户的总结和所有代理事实桶。

保留代理配置。

它逐代理迁移、加载事实、带删除修订提交删除。

最后清空总结。

用户删除和清空操作必须移除匹配的侧车数据。

（六）检索接口

search_facts搜索事实。

优先用适配器。脏作用域先重建。

重建失败退回子串搜索。

_search_substring是子串匹配回退。

无适配器时也走它。

rebuild_index重建索引。

支持全量重建和按作用域重建。

有bulk rebuild能力时原子替换。

没有时逐条upsert。

retrieal_status报告检索状态。

capabilities报告能力集合。

（七）侧车方法

get_fact_usage读使用量侧车。

record_fact_accesses记录实际查询命中。

命中只对存在的事实记录。

访问热度带时间衰减。

使用量和审计侧车在代理的.metadata/目录下。

它们不能改变规范Markdown的时间戳或修订。

审计只在规范持久化成功之后写。

record_capacity_eviction记录容量淘汰证据。

shadow_decision记录影子策略的不同意见。

clear_fact_metadata移除侧车数据。

## 七、迁移

（一）读取时的自动迁移

普通默认管理器的读取会迁移legacy事实到__default__。

_run_read_migrations_locked做三件事。

恢复日志。

全局JSON需要时做版本迁移。

有legacy代理JSON时做代理迁移。

migrate方法是显式的版本驱动迁移。

幂等。

按精确作用域运行。

（二）_migrate_locked方法

_migrate_locked合并legacy事实。

不覆盖已存在的规范事实。

legacy和全局两个来源都参与。

来源相同的事实验证等价性。

不等价抛MemoryStorageCorruption。

迁移是有意的单向操作。

应用运行期间单向。

操作者必须在迁移前停止DeerFlow并快照存储根。

每个破坏性的v1 JSON来源先写经过验证的.v1.bak备份。

备份缺失或不匹配时中止迁移。

v1数据不变。

总结冲突保留来源文件并返回错误。

两个摘要操作数在加法归一化之后比较。

安全摘要采用后才能删除legacy代理JSON。

或者等价性检查通过后删除。

（三）lead-agent旧桶迁移

_migrate_previous_default_bucket_locked移动早期lead-agent默认映射写的事实。

真实的自定义lead-agent有自己的config.yaml，永不触碰。

有任何其他意外文件的目录被保留并拒绝。

不会被猜测或递归删除。

意外文件阻止迁移并留在磁盘上。

删除事实Markdown后尝试逐级删除空目录。

## 八、create_storage工厂

create_storage是存储工厂。

retrieval_adapter配置决定适配器。

fts5用内置FTS5工厂。

其他值按模块路径导入工厂。

storage_class配置决定存储类。

空或file用FileMemoryStorage。

markdown用MarkdownMemoryStorage。

其他值按模块路径导入类。

导入的类必须是MemoryStorage的子类。

否则抛错。

配置失败拒绝静默回退。

拒绝的理由是记忆是持久状态。

静默回退可能指向另一个存储实现。

## 九、它和谁协作

（一）它依赖谁

它依赖paths.py定位所有文件。

它依赖eviction.py的FactEvictionDecision类型。

它依赖DeerMemConfig。

可选持有retrieval.py的适配器。

（二）谁调用它

updater.py通过MemoryStorage抽象接口使用它。

updater的get_memory_data、save_memory_to_file、fact CRUD都走它。

Gateway的记忆路由最终走它。

DeerMem本体持有它。

FileMemoryStorage拥有规范存储和检索适配器。

上层不得触碰它的私有适配器状态。

## 十、设计意图

这个模块体现多个核心设计。

第一个设计是规范数据是Markdown文件。

memory.json只是总结和修订数据。

每个事实单独一个文件。

目标写入只改选中的Markdown文件。

整文档load和save保持兼容操作。

第二个设计是多文件事务。

共享用户修订保护事务。

每个事实自己的修订保护单个Markdown对象。

不交叠的事务在共享修订变化后可以安全rebase。

恢复日志让崩溃后可以恢复。

第三个设计是类型化错误。

冲突用类型不用文本。

上层能精确响应。

第四个设计是派生数据分离。

检索索引可重建。

侧车数据可清除。

规范数据永远是Markdown。

## 重要性评级

评级是10分（满分10分）。

理由如下。

这个模块是整个记忆系统的持久化核心。

用户记忆的安全完全落在它身上。

它管理多文件事务、修订冲突、恢复日志、迁移。

这些任何一个出错都是用户数据丢失。

它的并发设计精细。

跨进程文件锁、弱引用锁缓存、签名校验。

它的迁移设计保守。

备份先行、冲突中止、意外文件拒绝。

它是最长的模块，1947行。

复杂度最高。

出错的历史教训也最多。

AGENTS.md里关于存储的约束条款最密集。

所有上层（updater、Gateway、工具）都依赖它。

它是这个包里唯一一个不设上限重要性的模块。

评10分。
