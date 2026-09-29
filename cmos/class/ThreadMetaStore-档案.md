# ThreadMetaStore-档案

## 一、这个类是干什么的

ThreadMetaStore是persistence/thread_meta/base.py里的抽象基类。

它是线程元数据存储的抽象接口。

实现如下。

ThreadMetaRepository是SQL支撑。sqlite或postgres。

MemoryThreadMetaStore包装LangGraph BaseStore。memory模式。

所有mutating和查询方法接受user_id参数。

三态语义。见runtime/user_context。

AUTO是默认。从请求作用域contextvar解析。

显式str按提供的值使用。

显式None绕过owner过滤。仅迁移和CLI。

这个类位于backend/packages/harness/deerflow/persistence/thread_meta/base.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、跨组件元数据键

THREAD_PINNED_METADATA_KEY是deerflow_pinned。

THREAD_ARCHIVED_METADATA_KEY是deerflow_archived。

THREAD_PROJECT_METADATA_KEY是deerflow_project_id。

和frontend的threads utils.ts和e2e mock-api.ts保持同步。

### 2、_ProjectFilterUnset

它是search(project_id=...)的哨兵。

区分缺席过滤和显式未分配。

单例模式。

absent filter表示不过滤。

显式未分配表示查无项目的线程。

### 3、InvalidMetadataFilterError

所有客户端提供的metadata filter键被拒绝时抛出。

客户端不能通过过滤键越权。

### 4、ThreadOwnershipConflictError

create会覆盖另一个用户拥有的线程时抛出。

### 5、ThreadMetaStore抽象方法

线程元数据的CRUD和查询。

包含pin、archive、project绑定。

## 三、它和谁协作

- ThreadMetaRepository是SQL实现。
- MemoryThreadMetaStore是memory实现。
- ThreadMetaRow是ORM行。
- ThreadMetaStore被gateway线程路由使用。

## 四、重要性评级

评级是6分。

理由如下。

这个契约是线程元数据存储的基座。

三态user_id语义。AUTO、显式、None。

_ProjectFilterUnset区分缺席和未分配。

InvalidMetadataFilterError防越权过滤。

ThreadOwnershipConflictError防覆盖别人线程。

这些是多用户隔离的关键。

扣掉4分。

扣分原因是它是契约层。
