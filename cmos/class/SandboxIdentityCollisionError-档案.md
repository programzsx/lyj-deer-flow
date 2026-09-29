# SandboxIdentityCollisionError档案

## 一、这个类是干什么的

这个类是aio_sandbox_provider.py模块里的公开异常类。

这个类继承自RuntimeError。

这个类表达一个关键语义。

这个语义是"一个确定性沙箱ID已经被另一个用户/线程组合追踪了"。

这个类解决的问题来自确定性ID机制。

沙箱ID是从user_id和thread_id确定性派生的。

同一user/thread永远派生同一个ID。

这带来了复用能力。

也带来了碰撞风险。

什么风险。

同一个沙箱ID被两个不同的身份组合争用。

例如旧记录把这个ID映射给了(userA, threadA)。

现在请求(userB, threadB)也想用这个ID。

如果放过去。

用户B会拿到用户A的沙箱。

用户A的工作区文件会暴露给用户B。

这是跨身份的数据泄漏。

所以provider在注册和重用路径上做身份断言。

断言失败就抛这个异常。

fail closed。

这个类在什么场景被使用。

场景是_assert_active_identity_available_locked和_assert_warm_identity_available_locked。

## 二、类的成员

这个类有一个自定义构造函数。

构造函数接收三个参数。

sandbox_id是发生碰撞的沙箱ID。

stored_key是已追踪的身份组合。

stored_key是(user_id, thread_id)元组或None。

requested_key是请求的身份组合。

构造函数做两件事。

第一件事是调用父类构造。

父类消息把三个值都拼进去。

消息是"sandbox ID collision for {sandbox_id}: tracked identity is {stored_key!r}, requested identity is {requested_key!r}"。

第二件事是把三个参数存到实例属性上。

这个类有三个实例属性。

sandbox_id是str。

stored_key是元组或None。

requested_key是元组。

这个类没有方法。

## 三、它和谁协作

它继承自RuntimeError。

它的抛出者有两个断言方法。

_assert_active_identity_available_locked检查活跃追踪的身份。

_assert_warm_identity_available_locked检查暖池条目的身份。

两个断言方法被四个注册/重用路径调用。

_reuse_in_process_sandbox间接依赖断言。

_reclaim_warm_pool_sandbox调用暖池断言。

_register_discovered_sandbox调用两个断言。

_register_created_sandbox调用两个断言。

它的捕获者只有_register_created_sandbox和_register_discovered_sandbox的异常处理块。

捕获后关闭刚构造的客户端并重新抛出。

acquire链路上层不捕获它。

失败会传播到沙箱工具调用方。

它和SandboxBeingDestroyedError、SandboxPolicyReplacementDeferredError并列。

三者是provider的三个生命周期异常。

它和_active_sandbox_identity、_warm_pool_identity两个字典配合。

那两个字典存身份映射。

断言方法读字典比对身份。

## 四、重要性评级（1-10分+理由）

评级是5分。

理由如下。

这个类是沙箱身份隔离的最后一道闸门。

确定性ID机制必须防止跨身份复用。

没有它。

一个配置错误或ID派生变更会让用户B进入用户A的沙箱。

工作区文件和上传文件会跨用户泄漏。

这是安全问题。

它携带三个值的详细信息。

日志能直接定位碰撞双方。

它的触发频率很低。

正常情况下身份映射一致，不会碰撞。

但触发时它是防泄漏的唯一屏障。

依赖范围限于provider文件内部。

评级给5分。
