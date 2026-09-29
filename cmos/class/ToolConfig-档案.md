# ToolConfig档案

一、这个类是干什么的

ToolConfig是单个工具的配置类。这个类描述一个工具的名字、所属组、提供者。提供者用类的导入路径表示。这个类继承自pydantic的BaseModel。extra设置为allow。允许携带额外字段。

二、类的成员

（一）字段

- name：字符串。必填。这个字段是工具的唯一名字。
- group：字符串。必填。这个字段是工具所属组的名字。
- use：字符串。必填。这个字段是工具提供者的变量名。例如deerflow.sandbox.tools:bash_tool。

（二）方法

这个类没有自定义方法。extra=allow允许配置里附带工具私有的额外设置。

三、它和谁协作

AppConfig持有这个类。AppConfig的tools字段是ToolConfig的列表。AppConfig的get_tool_config方法用名字查找这个类的实例。模型工厂和代理构建代码用use字段导入工具提供者。

四、重要性评级

评级：6分。

理由：工具是代理能力的来源。没有工具配置，代理就没有工具可用。但默认部署不一定需要显式配置每个工具。所以重要性中等偏上。
