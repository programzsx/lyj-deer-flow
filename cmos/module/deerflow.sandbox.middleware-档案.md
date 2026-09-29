# deerflow.sandbox.middleware档案

## 一、这个模块是干什么的

这个模块是沙箱生命周期管理中间件。

Agent需要一个沙箱才能执行命令。这个中间件负责创建沙箱环境。把沙箱分配给Agent。在Agent运行结束时释放。它是一个LangChain的AgentMiddleware。挂在Agent的中间件栈里。

这个中间件管理完整的沙箱生命周期。

- 懒初始化。默认在第一次工具调用时获取沙箱。
- 急切初始化。也可以在Agent调用开始时获取。
- 并发的lead和子代理执行持有独立的进程内租约。
- 只有最后一个执行释放时才把远程沙箱park进温池。
- provider的shutdown是最终清理边界。

这个中间件还管理网络策略审批。受限的沙箱尝试连接被策略阻止的地址时。中间件向用户发一张审批卡片。

## 二、模块里的主要成员

### 1、SandboxMiddleware类

这是中间件本体。

构造参数有下面这些。

- `lazy_init`，True（默认）在第一次工具调用时获取沙箱。False在before_agent急切获取。默认True为了性能。
- `available_skills`，可用的技能集合。为policy-scoped的技能隔离用。
- `owns_agent_skill_projection`，这个中间件是否可以创建或重建线程的物理技能投影。被委托的子代理共享lead线程沙箱。必须保留lead拥有的视图。不应用自己的发现策略。

主要方法有下面这些。

- `before_agent`，Agent调用开始。应用网络策略响应。准备技能投影。获取或恢复沙箱。把沙箱id写进运行时上下文和图状态。
- `abefore_agent`，异步对应物。
- `after_agent`和`aafter_agent`，Agent调用结束。释放沙箱。fork恢复的沙箱不释放。因为包装值重放父线程的沙箱状态。释放它会驱逐父的温沙箱。
- `wrap_tool_call`和`awrap_tool_call`，包装工具调用。检测懒初始化。把新获取的沙箱id通过Command持久化进图状态。处理网络审批事件。

### 2、沙箱获取和授权

获取沙箱前先做授权检查。

- 急切路径。before_agent里检查`authorize_sandbox_execution`。拒绝时跳过急切获取。不抛异常。因为这里的异常在任何工具调用之外。会以图级错误呈现。而不是RFC的友好ToolMessage。共享视图的运行跳过并延迟到懒门。policy-scoped的运行中止。因为保留旧的checkpointed沙箱会绕过新的文件系统视图。
- 懒路径。工具调用里的ensure_sandbox_initialized做同样的检查。

### 3、技能投影

`_prepare_agent_skill_projection`在任何沙箱被复用之前构建运行的物理技能视图。

- 子代理不拥有投影。子代理继承lead的线程id和沙箱状态。重建会改变并发Agent共享的文件系统。
- provider不支持Agent技能隔离时。有可用技能集合就抛SandboxRuntimeError。没有就用普通的共享技能行为。
- 支持时用`ensure_thread_skill_projection`构建。

### 4、网络策略审批

受限网络模式下。命令尝试连接被阻止的地址时。provider产生一个策略事件。

- 交互式运行。中间件消费最老的未呈现事件。发一张ToolMessage审批卡。卡片带deny、allow_temporary、allow_sandbox三个选项。命令不重试。用户决定后让Agent重试。
- 非交互运行和子代理。自动拒绝。排空并拒绝。绝不显示审批卡。因为没有人类响应者。
- 用户的选择通过`_apply_network_policy_response`应用。只应用当前用户回合的决定。旧卡的响应不能在普通对话后重放。
- 私有、环回、链路本地、组播、云元数据地址永远不能被批准。

### 5、工具调用包装

`wrap_tool_call`在工具调用前后对比沙箱状态。检测新的懒初始化。用`Command(update=...)`把沙箱id持久化进图状态。

为什么需要包装。`ensure_sandbox_initialized`直接改`runtime.state["sandbox"]`。那个改动只对当前工具调用生效。LangGraph的channel reducer看不到。后续的图步骤无法观察沙箱id。包装后diff前后状态。发一个正规的状态更新。

### 6、SandboxMiddlewareState类

中间件的状态schema。兼容ThreadState。带sandbox和thread_data字段。

## 三、它和谁协作

这个模块依赖`deerflow.sandbox.get_sandbox_provider`拿provider单例。依赖`deerflow.sandbox.lease`做租约管理。依赖`deerflow.authz.sandbox_authz`做授权检查。依赖`deerflow.agents.interaction_policy`判断交互性。

这个模块被lead代理和子代理的中间件栈使用。它是栈里的标准成员。

这个模块依赖`deerflow.skills.projection`构建技能投影。

## 四、重要性评级

评级是9分。

理由。这个模块是沙箱生命周期的直接管理者。Agent能不能拿到沙箱、什么时候拿、用完什么时候还，全部由它管理。没有它，工具调用就拿到沙箱。

授权和生命周期的结合设计很关键。获取前先检查授权。拒绝时优雅降级。懒初始化和急切初始化各有正确的授权处理。技能投影的拥有权区分lead和子代理。防止子代理改变共享文件系统。

网络审批的设计也很关键。受限网络的连接请求转成用户审批卡。非交互运行自动拒绝。旧卡响应不重放。这防止一个无人值守的运行等待一个永远不来的审批。

工具调用包装的设计解决了LangGraph状态可见性问题。懒初始化的沙箱id通过Command持久化进图状态。下游消费者能看到。

扣一分的原因。它是中间件层的编排者。实际的获取、创建、销毁在provider和lease里。
