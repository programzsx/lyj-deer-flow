# MiddlewarePlacement档案

一、这个类是干什么的

MiddlewarePlacement是一个中间件加它需要坐的位置的数据类。扩展贡献中间件时返回这个类。这个类是frozen dataclass。

二、类的成员

（一）字段

- middleware：Any类型。这个字段是中间件本身。类型是Any让这个模块保持轻导入。宿主在注入时校验类型。
- placement：Placement。这个字段是中间件需要坐的位置。
- scope：AgentScope。默认值是BOTH。这个字段是中间件对哪些代理生效。
- order：整数。默认值是0。这个字段是同位置贡献者的排序提示。

（二）方法

这个类没有自定义方法。这个类是纯数据类。

三、它和谁协作

MiddlewareContributor的contribute_middlewares方法返回这个类的序列。Placement和AgentScope是这个类的字段类型。宿主按位置和范围注入中间件。

四、重要性评级

评级：5分。

理由：这个类是扩展中间件注入的载体。位置语义靠Placement保证。所以重要性中等。
