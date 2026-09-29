# deerflow.sandbox.middleware

## 一、这个模块是干什么的

这个模块是沙箱中间件。

背景是这样的。

代理需要一个沙箱才能执行命令。

沙箱的生命周期要有人管。

这个中间件就是管沙箱生命周期的。

它在代理的中间件链里。

它做的事是这样的。

代理回合开始时获取沙箱。

获取方式分两种。

懒初始化是默认的。

第一次工具调用时才获取。

立即初始化是可选的。

代理回合一开始就获取。

获取时管理租约。

并发的lead和子代理执行持有独立的进程内租约。

只有最后一次执行释放时才把远程沙箱放回暖池。

它还管技能投影。

代理的技能视图是物理文件。

中间件在沙箱被复用前准备投影。

但只有lead拥有投影的所有权。

子代理共享lead的线程沙箱。

子代理不能重建投影。

否则会改大或改小共享文件系统。

它还管网络策略。

受限沙箱的网络请求要审批。

审批结果记录在状态里。

## 二、模块里的主要成员

- SandboxMiddleware：沙箱中间件。是AgentMiddleware的子类。
- 构造参数有lazy_init、available_skills、owns_agent_skill_projection。
- lazy_init决定沙箱是第一次工具调用才获取还是回合开始就获取。
- owns_agent_skill_projection决定这个中间件能不能创建或重建技能投影。
- _prepare_agent_skill_projection：在沙箱被复用前构建代理的技能视图。子代理跳过。
- _acquire_sandbox、_acquire_sandbox_async：获取沙箱。有租约时走租约管理器。
- _retain_existing_sandbox：复用已存在的沙箱。走租约的reuse_or_acquire。
- SandboxMiddlewareState：中间件的状态schema。兼容ThreadState。
- 中间件在代理钩子里管理沙箱的生命周期。

## 三、它和谁协作

- 它依赖sandbox的get_sandbox_provider获取提供者。
- 它依赖sandbox/lease管理租约。
- 它依赖sandbox/authz做授权。
- 它被agents/factory挂进中间件链。
- 它创建的沙箱被sandbox工具消费。

## 四、重要性评级

评级是8分。

理由是它是沙箱生命周期的管理者。

每一次需要沙箱的代理回合都经过它。

懒初始化和租约复用是性能和正确性的平衡。

子代理不重建投影的设计保护了共享文件系统。

它是中间件链里的关键环节。
