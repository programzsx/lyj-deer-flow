# deerflow.sandbox.local.local_sandbox_provider

## 一、这个模块是干什么的

这个模块是本地文件系统沙箱的提供者。

背景是这样的。

沙箱由提供者创建和管理。

本地模式下沙箱就是宿主机目录。

但目录必须按线程隔离。

这个提供者负责为每个线程产出沙箱。

早期版本返回一个进程级的单例。

单例没法保证/mnt/user-data的契约。

因为对应的宿主目录是按线程的。

所以现在每个线程id有独立的LocalSandbox。

沙箱的路径映射包含线程范围的条目。

包括workspace、uploads、outputs。

这和AIO提供者往容器里挂载是对应的。

这个类还管缓存。

线程沙箱缓存在内存里。

有上限。

超过上限就按最近最少使用淘汰。

被淘汰的线程下次重新构建。

它还管技能投影。

代理的技能视图是物理文件。

投影在沙箱获取时准备。

它还管线程安全。

多个线程可能同时获取沙箱。

所有缓存状态变更串行化。

## 二、模块里的主要成员

- LocalSandboxProvider：本地沙箱提供者。继承SandboxProvider。
- acquire(thread_id, user_id)：获取线程的沙箱。返回沙箱id。
- get(sandbox_id)：按id取沙箱实例。
- release(sandbox_id)：释放沙箱。
- reset()：重置所有缓存。
- shutdown()：关闭提供者。
- _build_thread_path_mappings：构建线程的路径映射。含user-data三个目录和技能目录。
- _ensure_skills_projection：准备技能投影。
- _evict_until_within_cap_locked：按LRU淘汰缓存的沙箱。默认上限256。
- _sandbox_id_for_thread：构造线程的沙箱id。
- supports_agent_skill_isolation：声明支持按代理隔离技能。
- 保留的虚拟前缀。自定义挂载不能和它们重叠。

## 三、它和谁协作

- 它实现sandbox/sandbox_provider的SandboxProvider抽象。
- 它创建sandbox/local/local_sandbox的LocalSandbox实例。
- 它被sandbox/middleware消费。沙箱生命周期由中间件驱动。
- 它被sandbox的get_sandbox_provider全局访问器返回。

## 四、重要性评级

评级是7分。

理由是它是本地模式沙箱的入口。

按线程隔离的路径契约由它保证。

LRU缓存防止长运行的内存膨胀。

线程安全的锁设计防止并发破坏缓存。

技能投影的准备也在这里。

它是本地模式的核心设施。
