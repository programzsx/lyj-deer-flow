# ModelTool档案

一、这个类是干什么的

ModelTool是模型工具的数据类。插件包贡献模型工具给代理使用。这个类描述工具的名字、描述、输入schema和处理函数。这个类是frozen dataclass。

二、类的成员

（一）字段

- name：字符串。这个字段是工具的名字。
- description：字符串。这个字段是工具的描述。
- input_schema：Mapping。这个字段是工具输入的schema。
- handler：异步可调用。这个字段是工具的处理函数。签名是接收参数映射和ToolContext。
- group：字符串。默认值是extensions。这个字段是工具所属的组。

（二）方法

这个类没有自定义方法。handler字段承载实际行为。

三、它和谁协作

PluginContribution的tools字段是这个类的元组。ToolContext是handler的第二个参数。宿主把工具注册进代理的工具列表。

四、重要性评级

评级：5分。

理由：这个类是插件给代理扩展能力的入口。模型工具直接影响代理能做什么。所以重要性中等。
