# ThreadOwnershipConflictError-档案

## 一、这个类是干什么的

ThreadOwnershipConflictError是persistence/thread_meta/base.py里的异常类。

它继承Exception。

它在create会覆盖另一个用户拥有的thread时抛出。

这个文档覆盖ThreadOwnershipConflictError加InvalidMetadataFilterError、_ProjectFilterUnset。

位于backend/packages/harness/deerflow/persistence/thread_meta/base.py。

## 二、类的成员（各自做什么）

### 1、ThreadOwnershipConflictError

它继承Exception。

create会覆盖另一个用户拥有的thread时抛出。

owner隔离的fail-loud信号。

### 2、InvalidMetadataFilterError

它继承ValueError。

所有客户端提供的metadata filter keys被拒绝时抛出。

filter keys必须匹配[A-Za-z0-9_-]+。

### 3、_ProjectFilterUnset

它是sentinel。单例。

区分search(project_id=...)的缺失filter和显式未分配。

_instance是ClassVar单例。

__new__返回同一实例。

## 三、它和谁协作

- ThreadMetaStore的实现抛这些。
- MemoryThreadMetaStore和ThreadMetaRepository实现存储。
- search API用_ProjectFilterUnset区分过滤语义。

## 四、重要性评级

评级是4分。

理由如下。

这三个类是thread metadata的边界信号。

owner冲突、无效filter、filter sentinel。

_ProjectFilterUnset区分"不过滤"和"过滤未分配"。这是JSON filter语义的一部分。

owner冲突防止跨用户覆盖。

扣掉6分。

扣分原因是它们是单行异常和sentinel。
