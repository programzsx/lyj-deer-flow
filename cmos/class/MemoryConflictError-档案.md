# MemoryConflictError-档案

## 一、这个类是干什么的

MemoryConflictError是agents/memory/manager.py里的异常类。

它继承MemoryManagerError。

它表示请求的写入输掉了乐观并发竞争。

这个类位于backend/packages/harness/deerflow/agents/memory/manager.py。

## 二、类的成员（各自做什么）

### 1、继承关系

MemoryConflictError继承MemoryManagerError。

### 2、语义

请求的写入输掉了乐观并发竞争时抛出。

DeerMem使用用户锁、共享revision、fact revisions。

点操作只在所有原始fact前置条件仍成立时rebase。

快照操作在manifest冲突后必须重载和重算。

### 3、Gateway映射

Gateway把冲突映射为HTTP 409。

用类型化的冲突类。不匹配异常文本。

### 4、用户锁体系

写入用用户锁。

弱锁缓存不保留非活动的用户scope。

缓存验证用manifest metadata和持久化的revision。

## 三、它和谁协作

- DeerMem的存储层抛它。
- Gateway映射为HTTP 409。
- MemoryManager契约定义它。

## 四、重要性评级

评级是4分。

理由如下。

这个类是memory写冲突的信号。

乐观并发竞争fail-loud。

类型化的冲突类。不匹配异常文本。

Gateway映射为409。

这些是并发写入正确性的关键。

扣掉6分。

扣分原因是它是单行异常类。
