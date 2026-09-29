# app.channels.sandbox_files-档案

## 一、这个模块是干什么的

这个文件提供沙箱文件同步的公共函数。

渠道收到用户发来的文件后要把文件同步到线程沙箱。

同步必须保证生命周期安全。

"生命周期安全"指同步过程不会跟并行的运行互相干扰。

一个并行的运行可能会关闭共享的沙箱客户端。

这个模块用租约机制防止这个问题。

## 二、模块里的主要成员

### 1、sync_file_to_thread_sandbox函数

sync_file_to_thread_sandbox是异步函数。

函数的作用是复制一个附件到线程沙箱。

函数持有沙箱客户端租约来复制文件。

函数的入参包括sandbox_provider、thread_id、user_id、virtual_path、content、owner_prefix。

release_on_last参数控制最后一个持有者退出时是否释放沙箱。

函数的流程分几步。

第一步是检查挂载方式。

provider开了uses_thread_data_mounts就直接返回True。

挂载型provider已经能看到持久化的上传文件。

不需要再同步。

第二步是获取沙箱客户端租约。

函数调用acquire_sandbox_client_lease。

租约要求唯一持有者。

唯一持有者保证并行的运行不能在update_file期间关闭客户端。

第三步是判断沙箱类型。

租约的sandbox_id是local或local开头就直接返回True。

本地沙箱文件直接可见，不需要同步。

租约的sandbox是None就返回False。

第四步是执行同步。

函数调用lease.run_sync执行sandbox.update_file。

虚拟路径和内容作为参数传入。

同步成功返回True。

第五步是在finally里释放租约。

释放前会先排空阻塞的传输worker。

渠道处理器被反复取消时也能排空。

排空完成才释放持有者。

release_on_last=True时所有执行持有者结束后会停用独立的临时沙箱。

释放失败记录警告日志。

## 三、它和谁协作

它依赖deerflow.sandbox.lease里的acquire_sandbox_client_lease。

它被manager.py的文件管线调用。

飞书和钉钉的非挂载沙箱同步走这个函数。

飞书在最终持有者退出后请求释放沙箱。

钉钉保留不释放的持有者行为。

## 四、重要性评级

评级是6分。

理由是文件同步的正确性靠这个模块保证。

没有租约保护，并行的运行会关掉共享客户端。

上传会中途失败。

飞书和钉钉的入站文件都依赖这里。

不评高分的原因是它只有一个函数，逻辑集中，不承载全局调度。
