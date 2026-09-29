# McpRoutingMiddleware档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/mcp_routing_middleware.py`

## 一、这个类是干什么的

McpRoutingMiddleware在模型调用前自动晋升延迟的MCP工具。

背景是这样的。
DeferredToolFilterMiddleware把延迟工具的模式从模型绑定里藏起来。
模型要先发现工具才能调用。
发现靠tool_search。也靠这个中间件的路由提示。

这个中间件看最新的用户文本。
用路由索引的关键词去匹配。
匹配上的工具名写进晋升状态。
下一个模型调用就能看到这些工具的模式。

它的定位刻意克制。

它只接收序列化的路由数据。
它不持有BaseTool对象。
它不执行工具。
它不过滤工具调用。
藏模式和阻止调用仍然是DeferredToolFilterMiddleware的职责。

新晋升的名字会发`middleware:tool_promotion`审计事件。来源是routing_hint。重复的通过不重复发。

## 二、类的成员

### （一）字段

- `routing_index`：路由索引。构造时注入。
- `catalog_hash`：工具目录哈希。
- `top_k`：最多晋升多少个工具。

### （二）方法

钩子方法是重点。

- `before_model`和`abefore_model`：模型调用前用最新用户文本匹配路由索引。把命中的工具名写进晋升状态。

辅助方法：

- `_normalize_index`：把路由索引规范化成名字到优先级加关键词的映射。
- `_latest_user_message`：取最新的用户编写消息。包括隐藏的人工输入卡片回复。因为卡片回复虽然是隐藏的。仍然是用户当前请求。
- `_matched_names`：算出本次匹配的工具名。
- `_state_update`：构造状态更新。

## 三、它和谁协作

- 它挂在中间件链上。位置在DeferredToolFilterMiddleware之前。
- 它消费McpRoutingIndex里的McpRoutingIndexEntry。
- 它写ThreadState.promoted。DeferredToolFilterMiddleware读这个。
- tool_search是它的兄弟晋升路径。路由提示是无查询成本的补充。

## 四、重要性评级

评级：6/10。

理由：没有自动晋升。模型每次都要先跑一次tool_search。多一轮调用。这个中间件省掉了常见工具的发现成本。但它只做提示。正确性兜底靠过滤器。所以给6分。