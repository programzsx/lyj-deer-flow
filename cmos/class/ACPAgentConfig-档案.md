# ACPAgentConfig档案

一、这个类是干什么的

ACPAgentConfig是单个ACP兼容代理的配置类。ACP是Agent Client Protocol。配置从config.yaml加载。这个类描述怎么启动一个ACP代理子进程。这个类还描述权限和超时策略。这个类继承自pydantic的BaseModel。

二、类的成员

（一）字段

- command：字符串。必填。这个字段是启动ACP代理子进程的命令。
- args：字符串列表。默认值是空列表。这个字段是附加的命令参数。
- env：字典。默认值是空字典。这个字段是注入子进程的环境变量。$开头的值从宿主环境变量解析。
- description：字符串。必填。这个字段是代理能力的描述。显示在工具描述里。
- model：字符串或None。默认值是None。这个字段是传给代理的模型提示。可选。
- auto_approve_permissions：布尔值。默认值是False。这个字段表示DeerFlow要不要自动批准所有ACP权限请求。True优先allow_once。False时所有权限请求都被拒绝。代理必须配置成不请求权限。
- timeout_seconds：整数。默认值是1800。最小值是1。这个字段是单次invoke_acp_agent调用的最大等待秒数。超时后中止调用并终止子进程。默认1800等于30分钟。和subagents.timeout_seconds一致。没有这个兜底。挂起的子进程会无限阻塞工具调用。

（二）方法

这个类没有自定义方法。这个类是纯数据类。

三、它和谁协作

AppConfig持有这个类。AppConfig的acp_agents字段的值类型是这个类。配置加载时load_acp_config_from_dict把字典转成这个类的实例。get_acp_agents返回已配置的代理映射。invoke_acp_agent工具读取这个实例。

四、重要性评级

评级：5分。

理由：ACP集成是外部代理的入口。timeout_seconds防止挂起阻塞。权限策略是安全相关。但默认无配置。所以重要性中等。
