# SandboxProvider档案

源码位置：backend/packages/harness/deerflow/sandbox/sandbox_provider.py

## 一、这个类是干什么的

SandboxProvider是沙箱提供者的抽象基类。

SandboxProvider定义了沙箱提供者必须提供的能力。具体实现继承它。实现包括LocalSandboxProvider、AioSandboxProvider、E2BSandboxProvider等。

SandboxProvider的能力有这些。

第一。生命周期。acquire获取沙箱并返回id。get按id取沙箱。release释放沙箱。release会销毁沙箱。

第二。异步包装。acquire_async在异步上下文里获取沙箱。获取不阻塞事件循环。大多数提供者的生命周期API是同步的。异步运行时应该调用acquire_async。阻塞操作跑在worker线程里。

第三。身份作用域。get_scoped只在沙箱属于这个身份时返回活跃沙箱。这个hook必须保持非阻塞的内存查找。不实现身份感知查找的提供者fail closed。fail closed后调用方通过acquire重新解析。

第四。技能同步。sync_agent_skills把准备好的线程技能投影同步进沙箱。绑定挂载的提供者直接观察投影根。用no-op实现。上传式的提供者重写它。

第五。网络策略。sandbox_network_mode返回出站网络模式。consume_network_policy_events领取最老的未呈现事件。deny_pending_network_policy_events原子拒绝所有未呈现事件。decide_network_policy_request应用用户的决定。没有托管网络策略的提供者用空默认。

模块级还有一个单例管理。get_sandbox_provider返回提供者单例。单例的初始化非常严谨。初始化考虑了多线程并发。考虑了竞态。考虑了失去安装竞态时的孤儿清理。

## 二、类的成员

（一）字段

- uses_thread_data_mounts：是否使用线程数据挂载。
- needs_upload_permission_adjustment：是否需要上传权限调整。
- supports_agent_skill_isolation：是否支持强制lead Agent的物理技能视图。

（二）方法

- acquire：获取沙箱。抽象方法。
- acquire_async：异步获取。默认用to_thread包装acquire。
- get：按id取沙箱。抽象方法。
- get_scoped：身份作用域的get。默认返回None（fail closed）。
- release：释放沙箱。抽象方法。
- sync_agent_skills：同步技能投影。默认no-op。
- reset：清除跨实例的缓存状态。
- sandbox_network_mode：返回网络模式。默认open。
- consume_network_policy_events：领取网络策略事件。默认空。
- deny_pending_network_policy_events：拒绝所有未呈现事件。默认False。
- decide_network_policy_request：应用用户决定。默认False。

（三）模块级函数

- get_sandbox_provider：获取提供者单例。锁保护。竞态时丢弃多余的实例。
- reset_sandbox_provider：重置单例。
- shutdown_sandbox_provider：关闭并重置。
- set_sandbox_provider：设置自定义提供者。测试用。

## 三、它和谁协作

（一）实现者

LocalSandboxProvider、AioSandboxProvider、E2BSandboxProvider、BoxliteProvider、TenkiSandboxProvider继承SandboxProvider。

（二）消费者

SandboxMiddleware通过get_sandbox_provider拿提供者。tools.py的沙箱工具也通过它拿沙箱。

（三）单例管理

单例用_provider_lock保护。回调跑在锁外。锁只保护引用交换。这样慢的或重入的提供者回调不会死锁。

## 四、重要性评级

评级：9分。

理由：SandboxProvider是沙箱提供者的接口基石。所有提供者实现和所有消费者都依赖这个抽象。它的单例管理处理了多线程竞态和孤儿实例泄漏。异步hook设计让阻塞操作不挡事件循环。没有它，沙箱就没有多实现的能力。给9分。
