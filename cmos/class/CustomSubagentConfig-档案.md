# CustomSubagentConfig档案

一、这个类是干什么的

CustomSubagentConfig是用户定义的子代理类型配置类。用户在config.yaml里声明这种子代理。这个类描述一个自定义子代理的提示词、工具白名单和运行限制。这个类继承自pydantic的BaseModel。

二、类的成员

（一）字段

- description：字符串。必填。这个字段是主代理应该在什么时候委派给这个子代理的说明。
- system_prompt：字符串。必填。这个字段是引导子代理行为的系统提示词。
- tools：字符串列表或None。默认值是None。这个字段是工具名白名单。None继承父代理的所有工具。
- disallowed_tools：字符串列表。默认包含task、ask_clarification和present_files。这个字段是要拒绝的工具名。
- skills：字符串列表或None。默认值是None。这个字段是技能白名单。None继承所有启用技能。空列表表示没有技能。
- model：字符串。默认值是inherit。这个字段是要用的模型。inherit表示用父代理的模型。
- max_turns：整数。默认值是50。最小值是1。这个字段是停止前的最大代理轮数。
- timeout_seconds：整数。默认值是900。最小值是1。这个字段是最大执行时长秒数。

（二）方法

这个类没有自定义方法。这个类只有八个字段。

三、它和谁协作

SubagentsAppConfig持有这个类。SubagentsAppConfig的custom_agents字典的值类型是这个类。自定义子代理注册时读取这个实例构建子代理类型。

四、重要性评级

评级：6分。

理由：这个类让用户扩展子代理类型。提示词和工具白名单直接决定子代理行为。默认拒绝危险工具。所以重要性中等偏上。
