# SubagentOverrideConfig档案

一、这个类是干什么的

SubagentOverrideConfig是每个子代理的配置覆盖类。覆盖叠加在全局子代理配置之上。这个类控制单个子代理的提示词、超时、轮数、模型、技能和预算。这个类继承自pydantic的BaseModel。

二、类的成员

（一）字段

- prompt_overlay：PromptOverlay实例。默认值是默认构造。这个字段是运维人员在子代理系统提示词前后的字面扩展。
- timeout_seconds：整数或None。默认值是None。最小值是1。这个字段是这个子代理的超时秒数。None用全局默认。
- max_turns：整数或None。默认值是None。最小值是1。这个字段是这个子代理的最大轮数。None用全局或内置默认。
- model：字符串或None。默认值是None。最小长度1。这个字段是这个子代理的模型名。None继承父代理的模型。
- skills：字符串列表或None。默认值是None。这个字段是技能白名单。None继承所有启用技能。空列表表示没有技能。
- token_budget：TokenBudgetConfig或None。默认值是None。这个字段是这个子代理的单次运行token预算覆盖。None用全局subagents.token_budget默认。

（二）方法

这个类没有自定义方法。这个类只有六个字段。

三、它和谁协作

SubagentsAppConfig持有这个类。SubagentsAppConfig的agents字典的值类型是这个类。PromptOverlay和TokenBudgetConfig是这个类的字段类型。SubagentsAppConfig的get_timeout_for等方法读取覆盖值。

四、重要性评级

评级：5分。

理由：这个类实现按子代理的精细覆盖。所有字段都是可选。没有覆盖时全局默认生效。所以重要性中等。
