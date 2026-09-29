# ToolDescriptor档案

一、这个类是干什么的

ToolDescriptor是代理组装后单个工具的描述数据类。描述记录工具的身份和哈希。工具的描述和schema用哈希表示。不记录原文。这个类是frozen dataclass。

二、类的成员

（一）字段

- name：字符串。这个字段是工具的名字。
- description_hash：字符串。这个字段是工具描述的哈希。
- schema_hash：字符串。这个字段是工具schema的哈希。
- source：字符串。这个字段是工具的来源。
- mcp_server：字符串或None。默认值是None。这个字段是工具所属的MCP服务器名。
- mcp_transport：字符串或None。默认值是None。这个字段是MCP传输类型。

（二）方法

这个类没有自定义方法。这个类是纯数据类。

三、它和谁协作

AgentAssemblyDescriptor的tools字段是这个类的元组。指纹计算用这些字段。工具按名字排序后进指纹。

四、重要性评级

评级：5分。

理由：这个类是代理指纹的工具部分。指纹回答代理装配是否变化。所以重要性中等。
