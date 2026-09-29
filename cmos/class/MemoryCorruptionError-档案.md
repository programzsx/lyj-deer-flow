# MemoryCorruptionError-档案

## 一、这个类是干什么的

MemoryCorruptionError是agents/memory/manager.py里的异常类。

它继承MemoryManagerError。

它表示持久化的memory不能安全读取。

这个类位于backend/packages/harness/deerflow/agents/memory/manager.py。

## 二、类的成员（各自做什么）

### 1、继承关系

MemoryCorruptionError继承MemoryManagerError。

### 2、语义

持久化的memory不能安全读取时抛出。

### 3、Gateway映射

Gateway把存储corruption映射为稳定的HTTP 500响应。

### 4、corruption的处理

DeerMem的tolerant summary reads是markdown存储的读路径。

不可解析的summary text在重建前被quarantine。

corrupt的持久化数据库被删除并重建一次。

## 三、它和谁协作

- DeerMem的存储层抛它。
- Gateway映射为HTTP 500。
- MemoryManager契约定义它。

## 四、重要性评级

评级是4分。

理由如下。

这个类是memory corruption的信号。

不能安全读取时fail-loud。

Gateway映射为稳定的HTTP 500。

和读失败、写冲突分开。

扣掉6分。

扣分原因是它是单行异常类。
