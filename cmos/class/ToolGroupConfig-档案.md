# ToolGroupConfig档案

一、这个类是干什么的

ToolGroupConfig是工具组的配置类。一个工具组把若干工具归到一起。这个类描述一个组的名字。这个类继承自pydantic的BaseModel。extra设置为allow。允许携带额外字段。

二、类的成员

（一）字段

- name：字符串。必填。这个字段是工具组的唯一名字。

（二）方法

这个类没有自定义方法。extra=allow允许配置里附带其他键值。这些键值不会被校验。

三、它和谁协作

AppConfig持有这个类。AppConfig的tool_groups字段是ToolGroupConfig的列表。ToolConfig的group字段引用工具组的名字。AppConfig的get_tool_group_config方法用名字查找这个类的实例。

四、重要性评级

评级：5分。

理由：工具组是工具组织的中间层。代理通过组名选择工具集合。没有工具组配置也能运行。但工具选择会影响代理能力。所以重要性中等。
