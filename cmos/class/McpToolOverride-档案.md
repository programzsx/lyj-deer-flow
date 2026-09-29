# McpToolOverride档案

一、这个类是干什么的

McpToolOverride是单个MCP工具的配置覆盖类。这个类描述按工具的MCP配置覆盖。覆盖叠加在服务器级配置之上。这个类继承自pydantic的BaseModel。extra为allow。

二、类的成员

（一）字段

- routing：McpRoutingConfig实例。默认值是默认构造。这个字段是这个工具的路由提示覆盖。

（二）方法

这个类没有自定义方法。extra为allow允许配置里附带其他键值。

三、它和谁协作

McpServerConfig持有这个类。McpServerConfig的tools字典的值类型是这个类。键是原始工具名。resolve_effective_mcp_routing函数读取覆盖并合并到服务器级路由。

四、重要性评级

评级：3分。

理由：这个类是McpRoutingConfig的按工具附属。只有一个字段。单独存在意义有限。所以重要性低。
