# MemoryMiddleware档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/memory_middleware.py`

## 一、这个类是干什么的

MemoryMiddleware在代理执行结束后把对话排队进记忆更新。

流程是这样的。

代理一轮跑完。
这个中间件把对话排队。
队列里只放用户输入和最终的助手回复。
工具调用被忽略。

队列用防抖把多次更新合批。
合批之后通过LLM摘要异步更新记忆。

有两个配置点。

一个是agent_name。指定了就按代理存记忆。不指定就用全局记忆。

一个是pii_redaction_config。开启了就在入队边界对载荷脱敏。因为请求范围的脱敏在线程状态里留原文。缓冲的载荷是持久的。提取模型的输入和持久化的事实都会带原始PII。所以入队时必须脱敏。

## 二、类的成员

### （一）字段

- `state_schema`：固定为MemoryMiddlewareState。

### （二）方法

钩子方法是重点。

- `after_agent`：代理执行完成后把对话排队进记忆更新。
- `aafter_agent`：异步路径用管理器的异步边界。走LangGraph的异步执行路径。

核心方法：

- `__init__`：接收agent_name、memory_config、pii_redaction_config。
- `_resolve_add_args`：解析一次写请求。不调管理器。
- `_redact_queued_messages`：对排队的对话载荷做PII脱敏。

## 三、它和谁协作

- 它挂在中间件链的运行结束位置。
- 它依赖记忆管理器做实际的更新。
- 它依赖记忆提取模块做LLM摘要。
- 它依赖PiiRedactionMiddleware的脱敏函数做入队脱敏。
- DynamicContextMiddleware负责记忆的读取。这个中间件只管写入队列。读写分离。

## 四、重要性评级

评级：7/10。

理由：记忆是长期价值的核心功能。没有这个中间件对话不会被提取成记忆。入队边界的脱敏防止了持久化PII泄漏。但它只是排队。提取质量取决于上游。所以给7分。