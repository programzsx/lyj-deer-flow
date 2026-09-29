# AgentsApiConfig档案

一、这个类是干什么的

AgentsApiConfig是自定义代理管理API的配置类。这个API管理自定义代理和用户画像。这个类只有一个开关。这个开关决定要不要通过HTTP暴露管理API。关闭时网关拒绝读写自定义代理的SOUL.md、config和USER.md路由。这个类继承自pydantic的BaseModel。

二、类的成员

（一）字段

- enabled：布尔值。默认值是False。这个字段表示是否通过HTTP暴露自定义代理管理API。

（二）方法

这个类没有自定义方法。模块级提供了get_agents_api_config、set_agents_api_config、load_agents_api_config_from_dict三个函数。这三个函数管理模块级单例。

三、它和谁协作

AppConfig持有这个类。AppConfig的agents_api字段是这个类的实例。配置加载时load_agents_api_config_from_dict把实例写入模块级单例。网关路由代码读取单例来决定是否挂载管理API。

四、重要性评级

评级：5分。

理由：这个API是代理管理入口。默认关闭。但一旦开启，这个开关决定管理面是否可见。所以重要性中等。
