# run_file_io-档案

## 一、这个类是干什么的

run_file_io不是类。

run_file_io是utils/file_io.py里的模块级函数。

这个函数把阻塞的文件系统工作放到专用文件IO池上运行。

Gateway的HTTP上传、列表、删除handler都通过它卸载文件系统工作。

两个关键设计如下。

第一，asyncio.to_thread自动复制ContextVar。

裸的loop.run_in_executor不复制。

这个函数显式复制当前上下文。

这样get_effective_user_id()这类用户级helper在worker线程里仍能工作。

第二，可重入。

从文件IO worker线程内部再调用时，func内联运行。

不再提交到池。

原因是池是有界的。

嵌套提交在所有worker都忙时会死锁。

配置单worker时是确定性死锁。

这个模块位于backend/packages/harness/deerflow/utils/file_io.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、_FILE_IO_EXECUTOR常量

这是专用线程池。

worker数默认min(32, CPU数加4)。

可用DEER_FLOW_FILE_IO_WORKERS覆盖。

线程名前缀是file-io。

### 2、run_file_io函数

签名是async run_file_io(func, /, *args, **kwargs)。

它把func放到文件IO池上运行。

worker里标记线程。

重入时内联运行。

### 3、await_drained函数

这个函数在调用者被取消时仍然把协程await到完成。

场景如下。

持有数据库行锁的事务await一个文件系统卸载。

取消await会放弃卸载的线程而不是工作。

锁可能在worker还在改文件时解开。

例如取消的purge回滚并解锁时它的unlink worker还在跑。

并发的restore可能校验正被废弃worker要删除的字节。

shield加drain让取消只在协程完全结束后才投递。

事务先一致地解决。

内部结果在重新抛出前被取回。

避免"exception never retrieved"噪音。

## 三、它和谁协作

- Gateway上传、列表、删除handler通过run_file_io卸载。
- uploads/manager和workspace_changes的清理用它。
- run_assembly和tools/sync.py是同模式兄弟模块。

## 四、重要性评级

评级是7分。

理由如下。

这个函数是文件IO卸载的标准通道。

ContextVar复制让用户级helper在worker里继续工作。

重入检测防死锁。

await_drained处理取消和行锁的竞争。

purge和restore的并发安全依赖它。

扣掉3分。

扣分原因是它是执行器管理辅助。

没有业务逻辑。
