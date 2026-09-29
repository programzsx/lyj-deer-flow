# FileMemoryStorage-档案

## 一、这个类是干什么的

FileMemoryStorage是agents/memory/backends/deermem/deermem/core/storage.py里的类。

它继承MemoryStorage。

它是DeerMem的默认文件存储。

按scope存内存。

内存布局如下。

每个scope是user_id加agent_name。

全局memory.json是用户全局摘要。

agent facts在agents/{agent_name}/facts下。

每个fact一个文件。

带version驱动的幂等迁移。

跨进程advisory文件锁。

进程内scope缓存。

这个类位于backend/packages/harness/deerflow/agents/memory/backends/deermem/deermem/core/storage.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、load方法

它加载一个scope的内存数据。

迁移检测如下。

journal文件存在或legacy路径存在或全局JSON需要迁移或previous_default_dir存在。

需要迁移时scope锁加process文件锁下运行读迁移。

迁移后dispatch检索通知。

scope签名缓存。

命中时返回deepcopy。

### 2、reload方法

reload强制重读。

并重建检索索引。

_rebuild_retrieval默认True。

### 3、migrate方法

它为一个精确scope运行幂等的version驱动迁移。

### 4、缓存结构

_memory_cache按scope作键。

签名对照检测变化。

deepcopy隔离调用方。

_cache_lock保护。

_scope_lock按scope串行。

_process_file_lock是跨进程advisory锁。

file_lock_timeout_seconds。

### 5、保存

save带expected_revision乐观并发。

原子写。temp文件加replace。

journal文件支持恢复。

### 6、apply_changes

apply_changes应用upserts、deletes、summaries变更集。

fact revision和manifest revision乐观并发。

### 7、检索同步

upsert、remove、clear时发检索通知。

_dispatch_retrieval_notifications同步检索索引。

rebuild_index重建。

### 8、markdown存储

MarkdownMemoryStorage是markdown后端。

容忍加载路径。

## 三、它和谁协作

- MemoryStorage是基类契约。
- MemoryUpdater通过它读写。
- RetrievalPort连接检索模块。
- scope锁和process文件锁。

## 四、重要性评级

评级是7分。

理由如下。

FileMemoryStorage是DeerMem持久状态的实现。

version驱动迁移。

跨进程advisory锁。

乐观并发。

scope缓存deepcopy隔离。

fact级存储。

检索同步。

这些是内存数据正确性的实现核心。

扣掉3分。

扣分原因是它是文件后端。实现层。
