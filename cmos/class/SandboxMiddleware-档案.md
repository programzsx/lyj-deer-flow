# SandboxMiddleware档案

源码位置：backend/packages/harness/deerflow/sandbox/middleware.py

## 一、这个类是干什么的

SandboxMiddleware是沙箱生命周期管理中间件。

SandboxMiddleware负责创建沙箱环境并分配给Agent。

SandboxMiddleware的职责有这些。

第一。沙箱获取。获取有两种模式。lazy_init为True时沙箱在第一次工具调用时获取。lazy_init为False时沙箱在第一次Agent调用时获取。默认是lazy_init为True。

第二。授权检查。每个eager获取路径都先做sandbox:execute授权检查。拒绝时共享视图的运行跳过获取。延迟到lazy工具门。策略作用域的运行直接中止。

第三。技能投影。有显式技能策略时，构建线程的物理技能视图。委派的subagent共享lead线程的沙箱。subagent必须保留lead拥有的视图，不能按自己的发现策略重建。

第四。沙箱释放。after_agent和aafter_agent释放沙箱。只有最终执行释放会把远程沙箱放进warm pool。fork恢复的沙箱不释放。释放父线程的fork恢复沙箱会把父的warm沙箱赶出去。

第五。网络审批。allowlist网络模式下，工具调用包装器消费网络策略事件。被阻止的目的地产生一张人工审批卡片。卡片有三个选项。拒绝。临时允许。本沙箱允许。非交互运行自动拒绝。subagent总是自动拒绝。

第六。沙箱状态持久化。懒获取的沙箱状态通过Command(update=...)持久化进图状态。工具调用包装器对比handler前后的状态快照。发现新的懒获取就附加状态更新。

## 二、类的成员

（一）字段

- _lazy_init：是否延迟初始化。默认True。
- _available_skills：可用技能集合。
- _owns_agent_skill_projection：是否可以创建或重建线程的物理技能投影。

（二）状态schema

- SandboxMiddlewareState：兼容ThreadState的图状态。带sandbox和thread_data字段。

（三）主要方法

- before_agent：Agent调用前。应用网络策略响应。准备技能投影。授权检查。获取或保留沙箱。
- abefore_agent：异步对应版本。
- after_agent：Agent调用后释放沙箱。
- aafter_agent：异步对应版本。
- wrap_tool_call：包装工具调用。检测新的懒获取并持久化。可能请求网络审批。
- awrap_tool_call：异步对应版本。
- _prepare_agent_skill_projection：构建物理技能视图。
- _acquire_sandbox：获取沙箱。有owner时走lease管理器。
- _retain_existing_sandbox：保留已有的沙箱。
- _apply_network_policy_response：应用用户的网络审批决定。

## 三、它和谁协作

（一）提供者

SandboxMiddleware通过get_sandbox_provider拿SandboxProvider。获取、释放、技能同步、网络策略都走provider。

（二）lease管理器

SandboxMiddleware用lease.py的SandboxLeaseManager管理执行租约。并发执行持有独立的租约。

（三）授权门

SandboxMiddleware用authz/sandbox_authz.py的authorize_sandbox_execution做授权。

（四）技能投影

SandboxMiddleware用skills/projection.py的ensure_thread_skill_projection构建投影。

## 四、重要性评级

评级：10分。

理由：SandboxMiddleware是沙箱系统的生命周期中枢。它串起获取、授权、投影、释放、网络审批、状态持久化六条职责。它是sandbox目录里最大的类。任何Agent运行要用沙箱都必须经过它。它的网络审批卡片机制是人工介入沙箱网络的唯一入口。给10分。
