# McpRoutingIndexEntry档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/mcp_routing_middleware.py`

## 一、这个类是干什么的

McpRoutingIndexEntry是一条MCP路由索引条目。

McpRoutingMiddleware根据最新的用户文本自动晋升延迟工具。
路由索引告诉它每个工具有什么路由特征。

这个类就是索引里的一个条目。
一个工具对应一个条目。

条目里有优先级和关键词。
关键词用来和用户文本匹配。
优先级用来在多个工具都匹配时排序。

这个类是TypedDict。纯数据。

## 二、类的成员

### （一）字段

- `priority`：路由优先级。整数。数字越大越优先。
- `keywords`：关键词列表。用来和用户文本匹配。

### （二）方法

McpRoutingIndexEntry没有定义自己的方法。

## 三、它和谁协作

- McpRoutingIndex聚合一批条目。
- McpRoutingMiddleware消费索引。匹配用户文本。

## 四、重要性评级

评级：3/10。

理由：McpRoutingIndexEntry是路由数据的最小单元。匹配逻辑在中间件里。它是纯数据。所以分数偏低。