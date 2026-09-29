# MemoryThreadMetaStore-档案

## 一、这个类是干什么的

MemoryThreadMetaStore是persistence/thread_meta/memory.py里的类。

它继承ThreadMetaStore。

它包装LangGraph BaseStore。memory模式。

线程元数据存在BaseStore的THREADS_NS命名空间。

异步键锁表串行线程操作。

这个类位于backend/packages/harness/deerflow/persistence/thread_meta/memory.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、MemoryThreadMetaStore本身

构造方法接受BaseStore。

_thread_locks是AsyncKeyedLockTable。

hold串行同线程操作。

### 2、_get_owned_record

它取记录并验证所有权。

返回可变副本。或None。

resolve_user_id解析user_id。

记录的user_id不匹配时返回None。

owner过滤。

### 3、create方法

Phase 1的memory模式没有projects后端。

带project_id的create抛ProjectNotAssignableError。

和SQL store对缺失、外来、归档项目fail closed相同。

路由映射到404。

不静默持久化未分配线程让run在其下进行。

镜像下面的set_project。它已报告拒绝。

incarnation保留已有的。没有时生成uuid。

所有权冲突时抛ThreadOwnershipConflictError。

锁下检查。

### 4、记录结构

记录带thread_id、incarnation、assistant_id、user_id、display_name、status、metadata、values。

status默认idle。

## 三、它和谁协作

- ThreadMetaStore是基类契约。
- LangGraph BaseStore是底层存储。
- AsyncKeyedLockTable串行线程操作。
- ProjectNotAssignableError来自projects。

## 四、重要性评级

评级是5分。

理由如下。

这个类是memory模式的线程元数据存储。

所有权验证。

project_id fail closed。

incarnation保留。

键锁串行。

这些质量不错。

扣掉5分。

扣分原因是它是memory模式的包装。使用面小。
