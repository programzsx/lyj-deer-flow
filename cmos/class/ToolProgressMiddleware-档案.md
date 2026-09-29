# ToolProgressMiddleware档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/tool_progress_middleware.py`

## 一、这个类是干什么的

ToolProgressMiddleware是基于状态机的工具停滞守卫。

它解决的问题是工具反复执行但不再产出新信息。
比如搜索一直返回no_results。模型还在换词重试。

架构是分层的。

ToolProgressMiddleware在外层。
内层是ToolErrorHandlingMiddleware。再内层是真实工具。
内层给结果盖上deerflow_tool_meta。
外层读这个元数据驱动状态机。

状态机按线程id加工具名维护。

转换规则分三种情况。

模型可恢复的问题。比如no_results、not_found、权限、Jaccard重复的成功。warned是终态。模型收到了提示。预期换策略。封锁反而挡住合法的换参重试。

不可恢复但不是stop类别的问题。比如transient、rate_limited。warned再累计几次升级成blocked。模型重试同样的工具解决不了。硬封锁节省API调用。

stop类别的失败。比如auth、config、internal。第一次出现立即blocked。重试没有意义。

新的代理运行开始时。所有工具状态重置成active。
因为限流和瞬态错误是时间绑定的。
旧计数带进新运行会在现在能成功的调用上误报封锁。

它和LoopDetectionMiddleware分工明确。
这个管单个工具的结果质量。在工具执行后触发。
那个管整轮的调用模式。在模型响应后触发。

## 二、类的成员

### （一）字段

配置在`__init__`里传入。来自ToolProgressConfig。

### （二）方法

钩子方法是重点。

- `before_agent`和`abefore_agent`：新运行开始时重置所有工具状态。
- `wrap_tool_call`和`awrap_tool_call`：工具调用边界。已封锁的调用在处理器之前拦截。执行后用结果更新状态机。
- `wrap_model_call`和`awrap_model_call`：模型调用边界。注入排队的提示。

核心方法：

- `from_config`：从配置构造。
- `_update_state_from_result`：用工具结果更新状态机。必要时排队提示。
- `_assess_and_transition`：返回新状态、可选提示和导致变化的规则。
- `_reset_run_states`：新运行开始时清空状态。计数和词集合窗口都清。
- `_make_blocked_message`：构建封锁消息。
- `_queue_assessment`、`_drain_pending`、`_restore_pending`：提示的排队、取走和回塞。
- `_record_phase_transition`：持久化一次生效的转换。不复制工具内容。

## 三、它和谁协作

- 它挂在ToolErrorHandlingMiddleware的外层。
- 它消费deerflow_tool_meta。由ToolResultMeta定义。
- 它和LoopDetectionMiddleware分工。
- LLMErrorHandlingMiddleware的重试会重新进入它的包装。提示要能被重新找到。
- 阶段转换进`middleware:tool_progress`审计事件。

## 四、重要性评级

评级：7/10。

理由：工具停滞是浪费配额的真实模式。恢复分类的设计很讲究。可恢复的问题不封锁。不可恢复的才封锁。stop类别立即封锁。这避免了误伤合法重试。新运行重置避免了跨运行的误报。它只覆盖有元数据的工具。所以给7分。