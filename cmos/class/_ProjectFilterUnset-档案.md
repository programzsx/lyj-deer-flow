# _ProjectFilterUnset-档案

## 一、这个类是干什么的

_ProjectFilterUnset是persistence/thread_meta/base.py里的sentinel类。

它区分search(project_id=...)的缺失filter和显式未分配。

它是单例。

这个类位于backend/packages/harness/deerflow/persistence/thread_meta/base.py。

## 二、类的成员（各自做什么）

### 1、单例机制

_instance是ClassVar单例。

__new__第一次创建实例。之后返回同一实例。

### 2、区分的语义

search不传project_id参数是"不过滤"。

显式传_ProjectFilterUnset是"过滤未分配的线程"。

两者语义不同。

### 3、为什么需要sentinel

project_id为None的线程是未分配的。

调用者可能想过滤"project_id IS NULL"。

普通None参数无法区分"没传"和"传了None"。

sentinel让这个区分可行。

## 三、它和谁协作

- ThreadMetaStore的search契约用它。
- MemoryThreadMetaStore和ThreadMetaRepository实现语义。

## 四、重要性评级

评级是4分。

理由如下。

这个类是过滤参数的sentinel。

区分缺失filter和显式未分配。

单例。

它支撑thread列表的project过滤语义。

扣掉6分。

扣分原因是它是一个sentinel。无逻辑。
