# AgentModelSettings档案

一、这个类是干什么的

AgentModelSettings是每个代理的LLM采样覆盖配置类。这些覆盖叠加在模型档案之上。这些是提供者的采样参数。不是DeerFlow运行时开关。两个代理引用同一个models档案时。这两个代理可以用不同的温度和输出长度。这个类继承自pydantic的BaseModel。extra为forbid。

二、类的成员

（一）字段

- temperature：浮点数或None。默认值是None。取值范围是0到2。这个字段是采样温度覆盖。None表示继承模型档案的值。
- max_tokens：整数或None。默认值是None。取值范围是1到200000。这个字段是最大输出token覆盖。None表示继承模型档案的值。

extra为forbid的原因是采样面是显式白名单。多余的键不能到达提供者请求体。要加新参数就声明新字段。

（二）方法

这个类没有自定义方法。这个类只有两个字段。

三、它和谁协作

AgentConfig持有这个类。AgentConfig的model_settings字段的类型是这个类。MANAGED_AGENT_CONFIG_FIELDS包含model_settings。代理更新面会携带这个字段。模型工厂把这些覆盖叠加到模型档案上。

四、重要性评级

评级：5分。

理由：这个类解决不同代理需要不同采样参数的问题。字段只有两个。但没有它共享档案的代理无法差异化。所以重要性中等。
