# SubagentsAppConfig档案

一、这个类是干什么的

SubagentsAppConfig是子代理系统的顶层配置类。这个类描述内置子代理的默认超时和轮数。这个类还承载按代理的覆盖和用户自定义子代理。这个类继承自pydantic的BaseModel。

二、类的成员

（一）字段

- timeout_seconds：整数。默认值是1800。最小值是1。这个字段是内置子代理的默认超时秒数。1800等于30分钟。
- max_turns：整数或None。默认值是None。最小值是1。这个字段是所有子代理的可选默认轮数覆盖。
- max_total_per_run：整数。默认值是6。取值范围是1到50。这个字段是一次主代理运行允许的子代理委派总数。这是确定性的兜底。
- token_budget：TokenBudgetConfig实例。默认由default_subagent_token_budget构造。这个字段是子代理的单次运行token预算。成本上限兜底默认启用。max_tokens和摘要开关耦合。摘要开着是100万。关着是200万。
- agents：字典。键是代理名。值是SubagentOverrideConfig。默认值是空字典。这个字段是按代理的配置覆盖。
- custom_agents：字典。键是代理名。值是CustomSubagentConfig。默认值是空字典。这个字段是用户定义的子代理类型。

（二）方法

- __init__：这个方法在构造后记录token_budget是不是用户显式设置的。记录在_token_budget_is_default里。
- get_timeout_for(agent_name)：这个方法返回某个代理的有效超时。按代理覆盖优先。否则全局默认。
- get_model_for(agent_name)：这个方法返回某个代理的模型覆盖。没有覆盖返回None。子代理继承父模型。
- get_max_turns_for(agent_name, builtin_default)：这个方法返回某个代理的有效最大轮数。优先级是按代理覆盖、全局覆盖、内置默认。
- get_skills_for(agent_name)：这个方法返回某个代理的技能覆盖。没有覆盖返回None。
- get_token_budget_for(agent_name, summarization_enabled)：这个方法返回某个代理的有效token预算。按代理覆盖优先。否则全局默认。默认值和摘要开关重新耦合。用户显式设置的预算永远原样生效。

模块级还有get_subagents_app_config和load_subagents_config_from_dict两个函数。load函数会丢弃等于默认值的token_budget键。这样保留用户没设置这个信号的语义。

三、它和谁协作

AppConfig持有这个类。AppConfig的subagents字段是这个类的实例。SubagentOverrideConfig、CustomSubagentConfig和TokenBudgetConfig是这个类的字段类型。子代理运行时和中间件构建代码读取这个实例。

四、重要性评级

评级：7分。

理由：子代理是主代理完成任务的主要方式。这个类控制子代理的成本兜底和运行限制。token预算和摘要的耦合逻辑防止失控运行。所以重要性中上。
