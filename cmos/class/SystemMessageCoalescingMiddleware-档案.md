# SystemMessageCoalescingMiddleware档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/system_message_coalescing_middleware.py`

## 一、这个类是干什么的

SystemMessageCoalescingMiddleware把多条SystemMessage合并成一条打头的SystemMessage。

问题来自严格的后端。

vLLM、SGLang、Qwen和Anthropic会拒绝不打头的SystemMessage。
报错是"System message must be at the beginning"或"Received multiple non-consecutive system messages"。
官方OpenAI API容忍会话中间的system消息。
所以这个问题只在严格后端上出现。

DeerFlow的lead agent为什么会积累多条SystemMessage。

DynamicContextMiddleware用id交换技术替换第一条或最后一条用户消息。
替换成的三元组里第一个元素就是SystemMessage提醒。
跨午夜时又注入第二条SystemMessage。
于是消息列表里出现了多条system消息。

这个中间件在`wrap_model_call`运行。
在处理器把system_message字段和消息列表摊平之前。
它把request.system_message加上消息列表里找到的每一条SystemMessage。
合并成一条打头的SystemMessage。
通过system_message字段发出去。

它只碰请求载荷。
持久的会话状态（checkpoint）不变。
所以按标记扫描历史的中间件照常工作。

它是提供方无关层的一个统一修复。
镜像了Claude提供方里已有的每请求合并逻辑。
让所有后端共享一个修复。而不是每个提供方打一个补丁。

## 二、类的成员

### （一）字段

没有声明公开字段。

### （二）方法

钩子方法是重点。

- `wrap_model_call`：同步钩子。在请求载荷上执行合并。把system_message和消息里的SystemMessage合并成一条打头的。
- `awrap_model_call`：异步版本的同一个钩子。

辅助方法：

- `release_policy_parameters`：声明影响行为的配置。
- `_maybe_coalesce`：执行合并的静态方法。没有SystemMessage时请求原样返回。

## 三、它和谁协作

- 它挂在中间件链的模型调用边界上。
- 它处理DynamicContextMiddleware用id交换产生的多条SystemMessage。
- SubagentDateContextMiddleware的日期提醒也由它合并。
- 它保护的目标是严格后端。vLLM、SGLang、Qwen、Anthropic。

## 四、重要性评级

评级：7/10。

理由：不合并的话严格后端会直接拒绝请求。整个线程报错。这是部署在自托管vLLM和Qwen场景的硬前提。它只碰请求不碰状态的设计也保住了checkpoint结构。但官方OpenAI路径不受影响。所以给7分。