# deerflow.runtime.store._sqlite_utils-档案

## 一、这个模块是干什么的

这个文件是store和checkpointer两个provider共享的SQLite连接工具。

它只有两个函数。

这两个函数解决两个小问题。

第一个问题是SQLite连接串怎么解析。

第二个问题是SQLite文件的父目录怎么建。

## 二、模块里的主要成员

### 1、resolve_sqlite_conn_str函数

这个函数返回可用的SQLite连接字符串。

三类输入的处理不同。

第一类。SQLite特殊字符串。:memory:和file:开头的URI。原样返回。

第二类。普通文件系统路径。相对或绝对都行。通过resolve_path解析成绝对字符串。

resolve_path来自deerflow.config.paths。它处理DEER_FLOW_HOME之类的路径解析。

### 2、ensure_sqlite_parent_dir函数

这个函数为SQLite文件路径创建父目录。

:memory:和file:URI是空操作。它们不是文件路径。

普通路径用mkdir。parents=True。exist_ok=True。

## 三、它和谁协作

它依赖deerflow.config.paths里的resolve_path。

它被runtime.checkpointer.provider调用。

它被runtime.checkpointer.async_provider调用。

它被runtime.store.provider调用。

它被runtime.store.async_provider调用。

## 四、重要性评级

评级是3分。

理由是这个模块功能非常小。

两个工具函数。被四个provider共享。

共享的意义是连接串解析规则不漂移。四个provider的SQLite行为保持一致。

不评更低分是因为SQLite是常用的持久化后端。路径解析错了会让持久化完全不可用。
