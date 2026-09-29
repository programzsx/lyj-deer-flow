# MemoryStorageCorruption档案

源文件位置：backend/packages/harness/deerflow/agents/memory/backends/deermem/deermem/core/storage.py

## 一、这个类是干什么的

这个类是一个异常类。

这个类表示全局记忆JSON或一条规范事实无法被安全解析。

存储层的文件可能被外部破坏。文件可能被手动编辑弄坏。文件可能只写了一半。这时存储层解析失败。解析失败时存储层抛这个异常。

这个异常标记的是数据损坏。数据损坏和普通的写入冲突是两种不同的故障。损坏需要人工介入。冲突只需要重新加载重试。所以存储层用两个不同的类区分这两种故障。

Gateway把这个异常映射为稳定的HTTP 500响应。冲突映射的是409。损坏映射的是500。两种响应不同。

## 二、类的成员

这个类继承自MemoryStorageError。MemoryStorageError继承自RuntimeError。

这个类没有自定义字段和方法。这个类只通过类名承载语义。

异常消息里带着具体信息。消息记录了损坏的文件路径和解析失败的原因。

## 三、它和谁协作

- MemoryStorageError是它的父类。父类是所有存储错误的基类。
- FileMemoryStorage负责抛出这个异常。JSON解析失败、事实Markdown解析失败、事实校验失败、迁移冲突、路径逃逸检查都会抛出这个异常。
- MarkdownMemoryStorage对部分场景做了容错。容错后坏摘要被隔离而不是抛这个异常。
- Gateway把这个异常映射为稳定的HTTP 500响应。

## 四、重要性评级

评级：2分。

理由：这个类是一个类型化的异常标记。这个类没有行为。这个类的价值是让数据损坏和普通错误可以被区分。Gateway靠这个类决定返回500而不是409。异常类在整个系统里的作用是辅助性的。
