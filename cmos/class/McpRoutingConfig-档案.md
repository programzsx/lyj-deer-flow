# McpRoutingConfig档案

一、这个类是干什么的

McpRoutingConfig是MCP工具偏好软路由的提示配置类。这个类控制要不要发出偏好提示。提示帮助模型优先选择MCP工具。这个类继承自pydantic的BaseModel。extra为forbid。

二、类的成员

（一）字段

- mode：字面量。取值是off或prefer。默认值是off。这个字段决定是否为匹配请求发出偏好MCP工具的提示。
- priority：整数。默认值是0。这个字段是路由提示的排序键。值越大越先渲染。校验器把负值钳到0。把超过100的值钳到100。
- keywords：字符串列表。默认值是空列表。这个字段是运维编写的关键词。描述什么时候应偏好这个MCP工具。

（二）方法

- _clamp_priority：字段校验器。这个方法把priority钳制在0到100之间。越界时打警告并钳制。

三、它和谁协作

McpServerConfig持有这个类。McpServerConfig的routing字段是这个类的实例。McpToolOverride也持有这个类。McpToolOverride的routing字段允许按工具覆盖。resolve_effective_mcp_routing函数合并两级路由。

四、重要性评级

评级：4分。

理由：软路由提示是辅助机制。off时什么都不做。只影响提示偏好。不改变硬行为。所以重要性偏低。
