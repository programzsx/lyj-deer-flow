# PromptOverlay档案

一、这个类是干什么的

PromptOverlay是系统提示词的字面扩展配置类。运维人员可以用这个类在组装好的系统提示词前后追加自己的文字。这个类继承自pydantic的BaseModel。这个类禁止未知字段。extra设置为forbid。

二、类的成员

（一）字段

- prepend：字符串。默认值是空字符串。strict模式。这段文字会被放在提示词前面。
- append：字符串。默认值是空字符串。strict模式。这段文字会被放在提示词后面。

（二）方法

- apply(prompt)：接收一个提示词字符串。这个方法把prepend、原提示词、append拼接起来。空的部分会被跳过。各部分之间用两个换行分隔。这个方法返回拼接结果。

三、它和谁协作

AppConfig持有这个类。AppConfig的lead_prompt_overlay字段是这个类的实例。SubagentOverrideConfig也持有这个类。SubagentOverrideConfig的prompt_overlay字段用于给子代理定制提示词扩展。

四、重要性评级

评级：5分。

理由：这个类直接影响系统提示词。提示词直接影响代理行为。但这个类只有两个字段加一个拼接方法。影响面明确且可控。所以重要性中等。
