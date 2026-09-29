# KnowledgeBaseConfig档案

一、这个类是干什么的

KnowledgeBaseConfig是知识库能力的配置类。这个类支持热加载。这个类控制知识能力要不要开。这个类还控制知识范围选择功能要不要开。提供者连接和检索选项不放在这里。提供者选项属于具体工具条目。这个类继承自pydantic的BaseModel。validate_default是开启的。

二、类的成员

（一）字段

- enabled：布尔值。默认值是False。这个字段表示知识库能力是否启用。
- scope_selection_enabled：布尔值。默认值是False。这个字段表示是否允许用户选择知识范围。

（二）方法

这个类没有自定义方法。这个类只有两个开关字段。

三、它和谁协作

AppConfig持有这个类。AppConfig的knowledge_base字段是这个类的实例。知识库相关运行时代码读取这个实例。自定义代理的config.yaml也可以引用知识范围选择。

四、重要性评级

评级：5分。

理由：知识库是核心能力之一。但这个类只是能力开关。真正的检索配置在别处。所以重要性中等偏低。
