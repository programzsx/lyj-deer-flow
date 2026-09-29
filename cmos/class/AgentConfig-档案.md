# AgentConfig档案

一、这个类是干什么的

AgentConfig是自定义代理的配置类。自定义代理存储在每个用户目录下。一个代理由SOUL.md和config.yaml组成。这个类描述一个代理的全部行为配置。这个类继承自pydantic的BaseModel。

二、类的成员

（一）字段

- name：字符串。这个字段是代理的名字。
- display_name：AgentDisplayName或None。默认值是None。这个字段是显示名。校验会去空白、限长100、拒绝控制字符。
- description：字符串。默认值是空字符串。这个字段是代理描述。
- model：字符串或None。默认值是None。这个字段是代理引用的模型档案名。
- tool_groups：字符串列表或None。默认值是None。这个字段是代理可用的工具组。
- skills：字符串列表或None。默认值是None。None加载所有启用的技能。空列表禁用所有技能。列表加载指定技能。
- mcp_plugins：字符串列表或None。默认值是None。这个字段是稳定的MCP安装ID。None继承全部。空列表不选任何。这是工具选择。不是宿主授权的替代。
- knowledge_scope：KnowledgeScope或None。默认值是None。这是新网关轮次的默认值。显式消息范围会覆盖它。这个字段在托管字段之外。harness自更新会保留绑定。
- allowed_subagents：字符串列表或None。默认值是None。这个字段控制代理可以调用哪些托管子代理。None表示全部。空列表表示没有。列表是白名单。
- model_settings：AgentModelSettings或None。默认值是None。这个字段是每个代理的LLM采样覆盖。
- thinking_enabled：布尔值或None。默认值是None。这个字段是每个代理的思考模式默认值。
- reasoning_effort：字面量。取值是low、medium或high。或None。默认值是None。这个字段是每个代理的推理力度默认值。
- memory_enabled：布尔值。默认值是True。这个字段为无状态代理关闭全部记忆路径。
- github：GitHubAgentConfig或None。默认值是None。这个字段是GitHub仓库集成绑定。

（二）方法

这个类没有自定义方法。模块级还有MANAGED_AGENT_CONFIG_FIELDS常量、preserve_non_managed_fields、resolve_agent_dir、load_agent_config、load_agent_soul、list_custom_agents。preserve_non_managed_fields让更新面不丢手工配置的字段。

三、它和谁协作

代理存储层读写这个类。AgentModelSettings和GitHubAgentConfig是它的字段类型。resolve_agent_dir用名字和user_id定位代理目录。配置加载从config.yaml和数据库构造这个类。代理工厂读取这个实例构建代理。

四、重要性评级

评级：8分。

理由：这个类是自定义代理的全部行为定义。模型、工具、技能、子代理范围都由它决定。手工配置的字段保护逻辑保证更新不丢数据。所以重要性高。
