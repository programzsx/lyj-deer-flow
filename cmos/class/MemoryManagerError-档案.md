# MemoryManagerError-档案

## 一、这个类是干什么的

MemoryManagerError是agents/memory/manager.py里的异常类。

它继承RuntimeError。

它是后端中性的基础错误。暴露在MemoryManager边界。

这个文档覆盖整个错误家族。

家族有MemoryManagerError、MemoryReadError、MemoryConflictError、MemoryCorruptionError。

位于backend/packages/harness/deerflow/agents/memory/manager.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、MemoryManagerError

它继承RuntimeError。

后端中性的基础错误。

### 2、MemoryReadError

必需的memory读失败。调用者必须不继续。

严格读使用它。

后端通过read_failures_are_fatal_for_config()声明自己的策略。

### 3、MemoryConflictError

请求的写入输掉了乐观并发竞争。

DeerMem把存储冲突转换为这些公共错误类型。

Gateway把冲突映射为HTTP 409。

用类型化的冲突类。不匹配异常文本。

### 4、MemoryCorruptionError

持久化的memory不能安全读取。

Gateway把存储corruption映射为稳定的HTTP 500响应。

### 5、fail_closed兼容

prompt loader保留MemoryManagerError加fail_closed兼容。

给没有采用类型化错误的第三方后端用。

## 三、它和谁协作

- MemoryManager的后端实现抛它们。
- Gateway把ConflictError映射为409。corruption映射为500。
- DynamicContextMiddleware在注入超时处保留read失败策略。

## 四、重要性评级

评级是5分。

理由如下。

这个家族是MemoryManager边界的错误信号。

读失败、写冲突、corruption三类分开。

Gateway按类型映射HTTP状态。409和500。

类型化的冲突类替代异常文本匹配。

fail_closed兼容第三方后端。

扣掉5分。

扣分原因是它们是无逻辑的异常类。
