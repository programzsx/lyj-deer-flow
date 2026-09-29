# MemoryManifestRevisionConflict档案

源文件位置：backend/packages/harness/deerflow/agents/memory/backends/deermem/deermem/core/storage.py

## 一、这个类是干什么的

这个类是一个异常类。

这个类表示共享的用户记忆修订号在一个事务提交之前发生了变化。

存储层的memory.json文件有一个共享修订号。多个写入方并发提交事务时，每个写入方都带着自己预期的修订号。提交时存储层核对当前修订号。当前修订号不等于预期修订号时，说明有别的写入方先改了。这时存储层抛这个异常。本次提交被拒绝。

apply_changes支持有限的重定基。重定基发生在所有原事实前提仍然成立时。重定基会重新读取当前修订号再试一次。重定基最多尝试三次。不能重定基时这个异常向上传播。

调用方应该捕获这个类型化的异常。调用方不应该匹配异常文本。

## 二、类的成员

这个类继承自MemoryRevisionConflict。MemoryRevisionConflict继承自MemoryStorageError。MemoryStorageError继承自RuntimeError。

这个类没有自定义字段和方法。这个类只通过类名区分冲突类型。

异常消息里带着具体信息。消息记录了预期修订号和实际修订号。

## 三、它和谁协作

- MemoryRevisionConflict是它的父类。父类覆盖所有修订冲突场景。
- MemoryStorageError是它的祖父类。
- FileMemoryStorage负责抛出这个异常。_commit_changes_locked在共享修订号不匹配时抛出。apply_changes捕获这个异常并尝试重定基。
- Gateway把这个冲突映射为HTTP 409响应。

## 四、重要性评级

评级：2分。

理由：这个类是一个类型化的异常标记。这个类没有行为。这个类只通过类名区分清单级别的冲突。它的存在让apply_changes的重定基逻辑可以精确捕获这种冲突。异常类在整个系统里的作用是辅助性的。
