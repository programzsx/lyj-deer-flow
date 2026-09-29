# deerflow.agents.middlewares.memory_middleware档案

源码路径是backend/packages/harness/deerflow/agents/middlewares/memory_middleware.py。

## 一、这个中间件是干什么的

这个中间件负责把对话排入记忆更新队列。

智能体每次执行完成后，这个中间件把本轮对话交给记忆管理器。

记忆管理器后续做异步的记忆提取。

这个中间件只负责入队。

真正的记忆提取、验证、事实写入都不在这里。

对话内容有过滤规则。

只有用户输入和最终AI回复才有记忆价值。

中间件把原始消息交给管理器。

后端会过滤出用户轮和最终AI轮，校验，检测纠正和强化，然后入队。

队列用防抖机制合并多次更新。

记忆更新通过LLM总结异步完成。

这个中间件还负责PII脱敏。

PII脱敏开启时，入队的对话载荷先做脱敏再交给管理器。

这一点很重要。

请求级的脱敏只改模型请求，线程状态里保留原文。

缓冲的载荷是持久的。

不脱敏的话，提取模型的输入和持久化的事实会带原始PII。

## 二、模块里的主要成员

### 1、MemoryMiddleware类

这是模块的核心类。

构造参数有三个。

agent_name提供时按agent存记忆，不提供时用全局记忆。

memory_config是显式记忆配置。

不提供时走旧的全局配置回退。

pii_redaction_config是PII脱敏配置。

启用时在入队边界脱敏。

### 2、after_agent和aafter_agent钩子

这两个钩子在智能体执行完成后入队对话。

同步路径和异步路径共用_resolve_add_args。

这个方法解析一次写请求，不调用管理器。

解析步骤如下。

先读记忆配置，配置未启用就返回None。

然后取thread_id。

优先从runtime.context取。

没有时回退到LangGraph的configurable元数据。

再取state里的messages。

消息为空就返回None。

然后捕获user_id。

捕获时机很关键。

记忆更新在threading.Timer线程上触发。

那个线程不继承ContextVar。

所以必须在请求上下文还活着的时候把user_id捕获成数据。

再捕获trace_id。

trace_id的权威来源是runtime上下文。

环境回退覆盖内嵌调用方在网关运行之外驱动智能体的场景。

最后对消息做脱敏，返回thread_id、脱敏后的消息、user_id和trace_id。

after_agent拿到参数后调用get_memory_manager().add入队。

aafter_agent用asyncio.to_thread拿到管理器，然后调用aadd。

### 3、redact_queued_messages函数

这是模块级共享函数。

入队边界和压缩触发的memory_flush_hook共用这个函数。

脱敏占位符是值派生的。

同一个身份在同一个批次里、跨多次入队、跨不同接缝，都渲染成同一个token。

消息对象重建，不原地修改。

### 4、_redact_tool_call和_redact_strings辅助函数

_redact_tool_call对单个工具调用字典做脱敏。

参数值递归脱敏。

_redact_strings对JSON-like值树里的每个字符串叶子做脱敏。

字符串键也脱敏。

因为工具参数可以在映射键里携带用户数据。

比如{"contacts": {"alice@example.com": "manager"}}。

两个不同的原始键脱敏成同一个token需要sha256碰撞。

如果脱敏后的键撞上已有键，条目合并。

这种情况被接受，因为128位哈希下只会发生在相同身份上。

### 5、MemoryMiddlewareState类

这是中间件的状态schema。

直接继承AgentState，与ThreadState schema兼容。

## 三、它和谁协作

这个中间件在中间件链里是lead专属的中间件。

它在lead_agent的build_middlewares里装配。

位置靠后，在TokenUsage和Title之间。

配置开关是memory.enabled，未启用时不装配。

依赖deerflow.agents.memory的get_memory_manager拿到记忆管理器。

记忆管理器是真正的下游消费者。

依赖pii_redaction_middleware的_make_redactor和_redact_content做脱敏。

依赖runtime.user_context的resolve_runtime_user_id解析用户身份。

依赖trace_context的resolve_trace_id解析追踪ID。

依赖human_input的HUMAN_INPUT_RESPONSE_KEY读取澄清回复原文。

依赖utils.messages的ORIGINAL_USER_CONTENT_KEY读取原始用户内容。

上游脱敏和上传保留原文。

入队载荷必须同时覆盖这两个位置。

只脱敏content的话，original_user_content或human_input_response.value还会泄露PII给记忆后端。

记忆只入队提取。

记忆召回用的是DynamicContext的dynamic_context_memory标记。

## 重要性评级

评级是7分。

理由如下。

持久记忆是智能体的核心能力之一。

这个中间件是记忆系统的入队入口。

没有它，对话不会进入记忆管线。

它还守住PII入队的脱敏边界。

脱敏覆盖content、工具调用参数、additional_kwargs的原文位置。

这个覆盖面考虑了OpenViking等保留完整消息对象的后端。

所以评级是7分。

不评更高分的理由是这个中间件只做入队。

记忆提取、事实选择、召回都不在这里。

memory.enabled关闭时整条链没有它。

也不评低分，因为入队边界的脱敏和身份捕获有真实的安全和正确性责任。
