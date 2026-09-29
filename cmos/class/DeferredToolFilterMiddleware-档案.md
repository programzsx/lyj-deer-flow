# DeferredToolFilterMiddleware档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/deferred_tool_filter_middleware.py`

## 一、这个类是干什么的

DeferredToolFilterMiddleware把还没晋升的延迟工具模式从模型绑定里藏起来。

tool_search开启的时候。
MCP工具仍然传给ToolNode用于执行路由。
但它们的模式不能一开始就发给LLM。
模型要先通过tool_search发现它们。

这个中间件在每次模型调用前。
把还在延迟状态的工具从request.tools里移除。
让模型只看到已激活工具的模式加已晋升的工具。

它还拦截对未晋升工具的调用。
模型直接调一个没晋升过的工具会收到阻止消息。

延迟名字集合和目录哈希在构造时注入。
晋升状态从图状态里读。
读取时按目录哈希限定范围。
过期的持久化晋升不能暴露改名或漂移过的工具。

## 二、类的成员

### （一）字段

- `deferred_names`：延迟工具名的frozenset。构造时注入。
- `catalog_hash`：工具目录哈希。用于范围限定晋升状态。

### （二）方法

钩子方法是重点。

- `wrap_model_call`：同步钩子。把未晋升工具从request.tools里过滤掉。
- `awrap_model_call`：异步版本的同一个钩子。
- `wrap_tool_call`：同步工具钩子。阻止对未晋升工具的调用。
- `awrap_tool_call`：异步版本的同一个钩子。

辅助方法：

- `release_policy_parameters`：声明影响行为的配置。
- `_promoted`：从状态里读已晋升的工具名集合。
- `_hidden`：算出当前要藏起来的工具集合。
- `_filter_tools`：执行request.tools的过滤。
- `_blocked_tool_message`：构建阻止未晋升调用的消息。

## 三、它和谁协作

- 它挂在中间件链的模型调用和工具调用两个边界上。
- McpRoutingMiddleware在它之前根据用户消息自动晋升工具。
- tool_search工具的晋升结果写进ThreadState.promoted。
- DeferredToolPromotionAuditMiddleware记录它的晋升决定。

## 四、重要性评级

评级：7/10。

理由：工具模式数量大的时候会撑爆模型上下文。延迟发现是控制上下文的关键机制。这个中间件是延迟机制里的强制执行者。没有它MCP工具模式会全部暴露给模型。所以给7分。