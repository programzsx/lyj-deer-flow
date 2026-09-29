# deerflow.utils.file_io 档案

## 一、这个模块是干什么的

这个模块提供"文件系统工作专用的异步卸载池"。

背景是这样的。

asyncio的代码不能跑阻塞的文件IO。阻塞调用会卡住整个事件循环。

普通做法是`asyncio.to_thread`。但大量文件IO调用会挤占默认executor。

这个模块提供专属的文件IO池。

核心价值有三个。

第一个。把阻塞的文件工作从事件循环卸载出去。

第二个。显式复制ContextVar。让用户id等上下文在worker线程里继续可用。

第三个。提供`await_drained`。让被取消的调用者等到文件工作真正完成。

## 二、模块里的主要成员

- `_default_file_io_workers()`。从环境变量`DEER_FLOW_FILE_IO_WORKERS`读worker数。默认是`min(32, CPU数+4)`。

- `_FILE_IO_EXECUTOR`。模块级ThreadPoolExecutor。线程名前缀file-io。atexit注册关闭。

- `_worker_call(call)`。在worker里跑调用。并标记线程。标记让`run_file_io`可重入。

- `run_file_io(func, *args, **kwargs)`。核心函数。在专属池上跑阻塞的文件工作。

  - ContextVar显式复制。`asyncio.to_thread`自动复制。裸的`run_in_executor`不复制。不复制的话用户作用域助手（例如get_effective_user_id）在worker线程里就失效了。

  - 可重入。从文件IO worker线程里再调run_file_io。函数直接内联跑。不再提交到池。池是有界的。嵌套提交会在所有worker都忙时死锁。配置单个worker时是确定性死锁。

- `await_drained(coro)`。等待一个协程跑完。即使调用者中途被取消。

  - 场景是。一个持锁的数据库事务在等一个文件卸载。取消await会丢下worker线程。但工作还在跑。锁可能在worker还在改文件时释放。并发恢复可能校验一个即将被删除的文件的字节。

  - 它用shield加drain。取消只在协程完全跑完后才传递。内部结果在重抛前先取。避免"异常从未被检索"的噪音。

## 三、它和谁协作

它只依赖标准库。

它被整个代码库的文件路径依赖。Gateway的HTTP上传、列表、删除处理器都通过它卸载文件工作。`utils/file_conversion.py`依赖它。

它被需要取消排干的场景依赖。数据库事务内的文件卸载用await_drained。

它是`utils/assembly_io.py`的同族模块。模式相同。

## 四、重要性评级

评级是7分。

理由如下。

它是所有文件IO的统一卸载通道。事件循环安全靠它。

可重入设计避免了确定性死锁。这个坑很隐蔽。配置单worker时嵌套提交必死。

await_drained处理了取消与文件工作的竞态。锁内卸载是真实的死锁和数据不一致来源。

上传、上传列表、删除、文档转换全都走它。用户可见功能直接依赖。

扣3分是因为它是基础设施工具。不承担业务语义。它是通道而非决策者。
