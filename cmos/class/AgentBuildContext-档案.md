# AgentBuildContext档案

一、这个类是干什么的

AgentBuildContext是扩展在决定贡献什么时可以知道的信息数据类。宿主在代理构建时构造这个类。这个类是frozen dataclass。

二、类的成员

（一）字段

- scope：AgentScope。这个字段是代理范围。
- agent_name：字符串或None。默认值是None。这个字段是代理名。
- model_name：字符串或None。默认值是None。这个字段是模型名。
- policy：HostPolicySnapshot。默认值是默认构造。这个字段是宿主实际执行的限流快照。

（二）方法

这个类没有自定义方法。这个类是纯数据类。

三、它和谁协作

MiddlewareContributor的contribute_middlewares方法接收这个类。AgentScope和HostPolicySnapshot是这个类的字段类型。扩展按这些信息决定贡献什么。

四、重要性评级

评级：5分。

理由：这个类是扩展贡献决策的输入。窄投影避免扩展绑定宿主内部。所以重要性中等。
