# SandboxBeingDestroyedError档案

## 一、这个类是干什么的

这个类是aio_sandbox_provider.py模块里的公开异常类。

这个类继承自RuntimeError。

这个类表达一个关键语义。

这个语义是"另一个实例正在销毁这个容器"。

此时容器绝不能交给代理使用。

这个类解决的问题要从一个竞态讲起。

销毁路径先claim所有权租约，再停容器。

claim和stop之间有一个窗口。

窗口里容器还活着，但正在被销毁。

如果acquire路径在这个窗口拿到了容器。

容器会在代理使用中途停掉。

工具调用就会失败。

这就是#4206描述的中途死亡。

所以acquire路径发现租约处于销毁状态时。

它抛出这个异常。

调用方的处理策略是固定的。

把容器从追踪里丢掉。

让正常的discover-or-create路径重新供给一个新沙箱。

而不是把一个即将消失的沙箱交给代理。

这个类在什么场景被使用。

场景是_publish_ownership发现take返回False。

以及几个注册路径发现本地销毁标记。

## 二、类的成员

这个类有一个自定义构造函数。

构造函数接收sandbox_id参数。

构造函数做两件事。

第一件事是调用父类构造。

父类消息是"sandbox {sandbox_id} is being destroyed by another instance"。

第二件事是把sandbox_id存到self.sandbox_id属性上。

这个类只有一个实例属性。

属性名是sandbox_id。

属性类型是str。

这个类没有方法。

## 三、它和谁协作

它继承自RuntimeError。

它的主要抛出者是AioSandboxProvider._publish_ownership。

take返回False就抛它。

它还在两个注册路径被抛。

_register_discovered_sandbox发现本地销毁标记时抛。

_register_created_sandbox不直接抛它但会捕获它。

它的捕获者有好几处。

_reuse_in_process_sandbox捕获后丢掉缓存并返回None。

_reclaim_warm_pool_sandbox捕获后放弃回收并返回None。

_register_created_sandbox捕获后回滚注册并清理。

返回None的效果是上层走discover-or-create冷启动。

它和OwnershipBackendError是兄弟异常。

两者都在acquire路径上拦截。

它和SandboxPolicyReplacementDeferredError、SandboxIdentityCollisionError并列。

三者是provider的三个生命周期异常。

## 四、重要性评级（1-10分+理由）

评级是6分。

理由如下。

这个类是跨实例销毁竞态的拦截信号。

没有它，销毁窗口里的acquire会拿到一个即将停掉的容器。

代理的活跃turn会中途死亡。

这是#4206最直接的用户可见症状。

它的存在让"发现正在销毁"变成一个可恢复的信号。

调用方丢掉旧容器，冷启动新沙箱。

系统自动恢复。

依赖范围是provider文件内部。

消息和sandbox_id属性方便日志定位。

如果删掉它。

take的False返回值会和"未知失败"混淆。

恢复策略无法精确表达。

评级给6分。
