# deerflow.workspace_changes.recorder

## 一、这个模块是干什么的

这个模块把工作区变更记录成持久化事件。

它是工作区变更功能的编排者。

流程是这样的。

运行开始前拍一次快照。

运行结束后再拍一次。

对比两次快照得到变更。

变更作为事件写进事件存储。

这个模块负责整个流程。

它还解决取消时的清理难题。

拍快照分两种模式。

带文本的扫描会建文本缓存。

不带文本的扫描不建缓存。

取消时的处理不同。

带文本的扫描必须等文本扫描跑完。

因为缓存的文本worker可能还在读。

缓存删早了，worker会读到不存在的文件。

不带文本的扫描没有缓存。

可以立即取消。

worker让它继续跑完，结果被消费掉。

这个约定有专门的回归测试覆盖。

## 二、模块里的主要成员

- build_thread_workspace_roots(thread_id, user_id)：构建线程的工作区根。两个根是workspace和outputs。
- capture_workspace_snapshot(...)：拍一次快照。内部先准备根和缓存目录，再把扫描派到worker线程。
- record_workspace_changes(...)：完整记录流程。扫描后置快照、对比、把变更写进事件存储。
- _prepare_capture：准备阶段。解析沙箱根目录、创建文本缓存目录。这些是阻塞IO，必须离开事件循环。
- _drain_scan_and_cleanup：取消时排空带文本的扫描。等扫描完成后删除缓存。
- _consume_cancelled_scan_outcome：消费被取消扫描的结果。只记日志。
- _remove_text_cache_dir：把删除缓存的操作放到worker线程。尽力而为，错误不能覆盖在途的异常。
- _reclaim_prepare_and_cleanup：准备阶段被取消时的回收路径。
- _cleanup_snapshot_text_cache：快照用完后删除文本缓存。

## 三、它和谁协作

- 它依赖scanner做实际扫描。
- 它依赖diff做快照对比。
- 它依赖event_store写变更事件。
- 它依赖config的get_paths解析沙箱目录。
- 它被runtime/runs/worker.py调用。worker在运行开始和结束时调它。

## 四、重要性评级

评级是6分。

理由是它是工作区变更功能的执行者。

它管理的取消排空逻辑是精细的并发正确性问题。

缓存删早了会引发文件读取错误。

它有专门的阻塞IO回归测试保护。

但影响面局限于变更记录路径。
