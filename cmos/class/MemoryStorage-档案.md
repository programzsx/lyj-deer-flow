# MemoryStorage-档案

## 一、这个类是干什么的

MemoryStorage是agents/memory/backends/deermem/deermem/core/storage.py里的抽象基类。

它是DeerMem的持久内存存储契约。

文件后端和markdown后端实现它。

存储按(user_id, agent_name)分桶。

全局摘要JSON加per-agent facts目录。

它处理乐观并发。

revision冲突。

迁移备份。

这个类位于backend/packages/harness/deerflow/agents/memory/backends/deermem/deermem/core/storage.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、错误层级

MemoryStorageError是持久内存失败的基类。

MemoryStorageCorruption是全局内存JSON或规范fact无法安全解析。

MemoryRevisionConflict是stale写者试图覆盖更新的user-memory revision。

MemoryManifestRevisionConflict是共享user-memory revision在事务提交前改变。

MemoryFactRevisionConflict是fact不再满足期望的缺席或revision。

### 2、RetrievalPort

它是存储面向的adapter。

独立检索模块实现它。

upsert、remove、search、clear、rebuild。

检索和存储解耦。

### 3、create_empty_memory

它返回兼容文档形状。

version、revision、lastUpdated。

user节有workContext、personalContext、topOfMind、cognitiveStyle。

history节有recentMonths、earlierContext、longTermBackground。

facts列表。

### 4、MemoryStorage抽象方法

load加载内存数据。

reload重新加载。

save保存。带expected_revision。

apply_changes应用变更集。upserts加deletes加summaries。

get_fact_usage取fact使用统计。

record_capacity_eviction记录容量淘汰审计。

### 5、规整

normalize_memory_data规整内存数据。

_normalize_context_section返回规范摘要节。保留扩展字段。

_normalize_legacy_import_fact规整legacy导入fact。

_normalize_fact规整fact。

_normalize_category规整类别。

_require_string_list要求字符串列表。

### 6、迁移

_ensure_migration_backup在迁移前备份。

_file_signature是文件签名。

_content_hash是内容哈希。

### 7、markdown存储对照

MarkdownMemoryStorage继承FileMemoryStorage。

容忍加载路径。磁盘上同样JSON。

### 8、scope

_scope_dict构建scope字典。

user_id和agent_name。

## 三、它和谁协作

- MemoryUpdater通过它读写。
- FileMemoryStorage和MarkdownMemoryStorage是实现。
- RetrievalPort连接独立检索模块。
- DeerMem拥有它。

## 四、重要性评级

评级是7分。

理由如下。

这个契约是DeerMem持久状态的基座。

乐观并发的revision冲突层级完整。

迁移备份。

规整函数防畸形持久状态。

RetrievalPort解耦检索。

这些是内存数据正确性的关键。

扣掉3分。

扣分原因是它是存储契约层。
