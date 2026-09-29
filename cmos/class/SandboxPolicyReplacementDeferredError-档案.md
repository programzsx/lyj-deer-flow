# SandboxPolicyReplacementDeferredError档案

## 一、这个类是干什么的

这个类是aio_sandbox_provider.py模块里的公开异常类。

这个类继承自RuntimeError。

这个类表达一个关键语义。

这个语义是"一个供给策略不兼容的沙箱还不能被替换"。

替换要推迟到它变成真正的孤儿。

这个类解决的问题要从一个滚动升级场景讲起。

旧版本Gateway用一个策略启动了沙箱。

新版本Gateway的策略变了。

新版本发现旧沙箱的持久化策略不兼容。

它能不能立刻销毁旧沙箱。

不能。

旧Gateway可能还在用这个容器服务活跃的turn。

旧沙箱还有活跃的所有权租约。

所以替换必须等。

等到旧沙箱变成孤儿。

孤儿的意思是所有者已释放、租约已过期。

这就是"推迟替换"的语义。

这个异常承载这个语义。

发现不兼容沙箱但不能立刻替换时抛出它。

这个类在什么场景被使用。

场景是_register_discovered_sandbox收到requires_replacement=True的SandboxInfo。

以及_discover_or_create_with_lock的替换失败分支。

## 二、类的成员

这个类有一个自定义构造函数。

构造函数接收sandbox_id参数。

构造函数做两件事。

第一件事是调用父类构造。

父类消息是"sandbox {sandbox_id} has an incompatible provisioning policy; replacement is deferred until its current owner releases it"。

第二件事是把sandbox_id存到self.sandbox_id属性上。

这个类只有一个实例属性。

属性名是sandbox_id。

属性类型是str。

这个类没有方法。

## 三、它和谁协作

它继承自RuntimeError。

它的抛出者有两处。

_register_discovered_sandbox在info.requires_replacement时直接抛。

_discover_or_create_with_lock在_replace_incompatible_sandbox返回False时抛。

异步版本_discover_or_create_with_lock_async同样处理。

它的捕获者值得注意。

acquire链路上没有一个方法捕获它。

它一路传播到沙箱工具的调用方。

这是设计意图。

策略不兼容意味着当前配置无法安全使用这个沙箱。

这个失败必须让上层看见。

上层可以提示操作者调整配置或等待。

它和SandboxBeingDestroyedError、SandboxIdentityCollisionError并列。

三者是provider的三个生命周期异常。

它和SandboxInfo.requires_replacement标志直接对应。

那个标志是backend报告不兼容的方式。

这个异常是provider转发给上层的方式。

## 四、重要性评级（1-10分+理由）

评级是5分。

理由如下。

这个类是滚动升级安全的关键信号。

没有它，新版本Gateway会立刻销毁旧版本正在用的沙箱。

活跃的turn会中途死亡。

滚动升级会变成故障。

它把"必须等"从静默跳过变成了显式失败。

上层能感知到配置不兼容这个事实。

依赖范围限于provider文件和acquire链路。

它的使用频率不高。

只在策略变更大版本升级时触发。

但触发时它是唯一的保护屏障。

评级给5分。
