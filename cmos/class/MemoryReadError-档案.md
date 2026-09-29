# MemoryReadError-档案

## 一、这个类是干什么的

MemoryReadError是agents/memory/manager.py里的异常类。

它继承MemoryManagerError。

它表示必需的memory读失败。调用者必须不继续。

这个类位于backend/packages/harness/deerflow/agents/memory/manager.py。

## 二、类的成员（字段，各自做什么）

### 1、继承关系

MemoryReadError继承MemoryManagerError。

### 2、语义

必需的memory读失败时抛出。

调用者必须不继续。

### 3、后端策略声明

后端通过read_failures_are_fatal_for_config()声明自己的读失败策略。

严格读使用这个错误类型。

DynamicContextMiddleware在注入超时处保留那个策略。

### 4、和MemoryConflictError、MemoryCorruptionError的关系

读失败是MemoryReadError。

写冲突是MemoryConflictError。

corruption是MemoryCorruptionError。

三类分开。调用者按类型处理。

## 三、它和谁协作

- MemoryManager的后端实现抛它。
- DynamicContextMiddleware按策略处理。

## 四、重要性评级

评级是4分。

理由如下。

这个类是memory读失败的信号。

严格读fail-loud。调用者不带着缺失的memory继续。

read_failures_are_fatal_for_config让后端声明策略。

扣掉6分。

扣分原因是它是单行异常类。
