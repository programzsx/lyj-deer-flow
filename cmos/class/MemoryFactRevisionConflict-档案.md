# MemoryFactRevisionConflict档案

源文件位置：backend/packages/harness/deerflow/agents/memory/backends/deermem/deermem/core/storage.py

## 一、这个类是干什么的

这个类是一个异常类。

这个类表示一条事实不再满足它预期的状态。预期状态包括预期的缺失和预期的修订号。

存储层用双重修订号保护并发写入。共享JSON修订号保护多文件事务。每条事实还有自己的修订号。事实修订号保护单个Markdown对象。当另一个事务安全地重定基之后，事实修订号可能已经变了。这时如果调用方还带着旧的事实修订号来提交，存储层就抛这个异常。

调用方应该捕获这个类型化的异常。调用方不应该匹配异常文本。匹配文本是脆弱的做法。

## 二、类的成员

这个类继承自MemoryRevisionConflict。MemoryRevisionConflict继承自MemoryStorageError。MemoryStorageError继承自RuntimeError。

这个类没有自定义字段和方法。这个类只通过类名区分冲突类型。

异常消息里带着具体信息。消息记录了预期的事实ID、预期修订号和实际修订号。

## 三、它和谁协作

- MemoryRevisionConflict是它的父类。父类覆盖所有修订冲突场景。
- MemoryStorageError是它的祖父类。祖父类是所有存储错误的基类。
- FileMemoryStorage负责抛出这个异常。_normalize_fact在事实修订号不匹配时抛出。_commit_changes_locked在新增性检查和删除检查中抛出。
- MemoryUpdater和上层调用方负责捕获这个异常。捕获后可以重新加载再重试。
- Gateway把这个冲突映射为HTTP 409响应。

## 四、重要性评级

评级：2分。

理由：这个类是一个类型化的异常标记。这个类没有行为。这个类只有类名承载语义。它的价值是让调用方可以按类型区分冲突场景。异常类在整个系统里的作用是辅助性的。异常类丢失不影响正常功能。
