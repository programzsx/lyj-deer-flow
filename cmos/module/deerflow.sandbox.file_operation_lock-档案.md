# deerflow.sandbox.file_operation_lock档案

## 一、这个模块是干什么的

这个模块为沙箱文件操作提供进程内的锁。

多个并发的工具调用可能同时操作同一个沙箱里的同一个文件。比如两个str_replace同时改一个文件。没有锁就会互相覆盖。这个模块提供按（沙箱id，路径）键的进程内锁。

同一把锁被`write_file`和`str_replace`工具使用。写文件和子串替换都先拿这把锁。保证同一沙箱同一路径的写操作串行。

## 二、模块里的主要成员

### 1、_FILE_OPERATION_LOCKS锁表

这是一个弱引用字典。键是（沙箱id，路径）元组。值是threading.Lock。

用WeakValueDictionary防止长运行进程的内存泄漏。锁不再被任何线程引用时自动从表里移除。

表还有一把守卫锁`_FILE_OPERATION_LOCKS_GUARD`。保护对表的读写。

### 2、get_file_operation_lock_key函数

为一个沙箱和路径生成锁键。

沙箱的id从`getattr(sandbox, "id", None)`读。没有id的沙箱用实例id兜底。格式是`instance:<对象id>`。

键是（沙箱id，路径）二元组。

### 3、get_file_operation_lock函数

为一个沙箱和路径取锁。流程如下。

- 生成锁键。
- 持守卫锁查表。
- 表里有直接返回。
- 表里没有就新建一把锁。放进表。返回。

同一（沙箱id，路径）的调用者拿到同一把锁。不同的拿到不同的锁。互不阻塞。

## 三、它和谁协作

这个模块依赖`deerflow.sandbox.sandbox.Sandbox`。锁键用沙箱的id。

这个模块被`deerflow.sandbox.tools`使用。write_file_tool和str_replace_tool在写操作前后用`with get_file_operation_lock(sandbox, path):`包住。

这个模块和`deerflow.sandbox.local`间接协作。锁键是沙箱id。本地沙箱的id是per-thread的。所以不同线程的沙箱互不阻塞。

## 四、重要性评级

评级是6分。

理由。这个模块保护同一沙箱同一文件的写操作串行。没有它，两个并发的str_replace会互相覆盖。写文件的原子性会被破坏。

WeakValueDictionary的设计很关键。长运行的Gateway进程会积累大量（沙箱id，路径）键。弱引用让不再使用的锁自动回收。表不会无限增长。

但它的职责非常窄。就是一个简单的进程内锁表。代码量很小。它只保护进程内的写操作。跨进程的文件操作不归它管。所以重要性是中等偏下。
