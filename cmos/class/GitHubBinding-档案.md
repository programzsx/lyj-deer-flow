# GitHubBinding档案

一、这个类是干什么的

GitHubBinding是一对代理和仓库的绑定配置类。这个类描述代理监听哪个仓库。这个类还携带按事件的触发器覆盖。这个类继承自pydantic的BaseModel。

二、类的成员

（一）字段

- repo：字符串。必填。这个字段是GitHub的owner/name格式仓库串。
- triggers：字典。键是事件名。值是GitHubTriggerConfig。默认值是空字典。这个字段是按事件的触发器覆盖。缺键时回落到分发器的默认触发器。

（二）方法

这个类没有自定义方法。这个类只有两个字段。

三、它和谁协作

GitHubAgentConfig持有这个类。GitHubAgentConfig的bindings字段是这个类的列表。GitHubTriggerConfig是triggers的值类型。GitHub分发器读取绑定来决定webhook投递给哪个代理。

四、重要性评级

评级：4分。

理由：这个类是GitHub集成绑定的中间层。没有绑定代理不会从webhook触发。它是简单数据类。所以重要性偏低。
