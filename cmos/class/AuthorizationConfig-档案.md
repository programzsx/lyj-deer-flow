# AuthorizationConfig档案

一、这个类是干什么的

AuthorizationConfig是细粒度资源授权的配置类。启用后可插拔的AuthorizationProvider成为资源级授权的策略大脑。强制在两层执行。第一层是装配时的能力过滤。代理永远看不到被禁的工具。第二层是运行时的执行拒绝。复用GuardrailMiddleware经适配器。默认关闭。关闭时每个已认证用户访问所有工具、模型、技能和沙箱。这个类继承自pydantic的BaseModel。

二、类的成员

（一）字段

- enabled：布尔值。默认值是False。这个字段表示是否启用细粒度授权。
- fail_closed：布尔值。默认值是True。这个字段表示提供者出错或身份未解析时要不要阻止访问。
- default_role：字符串。默认值是user。这个字段是user_role为None时应用的角色。例如未绑定的IM频道。
- provider：AuthorizationProviderConfig或None。默认值是None。这个字段是授权提供者的配置。

（二）方法

这个类没有自定义方法。模块级提供了get_authorization_config、load_authorization_config_from_dict、reset_authorization_config三个函数。这三个函数管理模块级单例。

三、它和谁协作

AppConfig持有这个类。AppConfig的authorization字段是这个类的实例。配置加载时load_authorization_config_from_dict写入模块级单例。AuthorizationProviderConfig是provider字段的类型。装配层和运行时中间件读取单例。

四、重要性评级

评级：7分。

理由：这个类是资源授权的总开关。fail_closed决定了安全兜底方向。配置错误会让授权失效。所以重要性中上。
