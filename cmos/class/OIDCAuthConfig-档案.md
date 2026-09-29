# OIDCAuthConfig档案

一、这个类是干什么的

OIDCAuthConfig是OIDC SSO认证的顶层配置类。这个类控制SSO要不要开。这个类还承载所有身份提供者的配置。这个类继承自pydantic的BaseModel。

二、类的成员

（一）字段

- enabled：布尔值。默认值是False。这个字段表示是否启用OIDC SSO认证。
- frontend_base_url：字符串或None。默认值是None。这个字段是前端的基础URL。反向代理时用于回调重定向。
- providers：字典。键是提供者ID。值是OIDCProviderConfig。默认值是空字典。这个字段承载所有提供者的配置。例如keycloak、google、azure。

（二）方法

这个类没有自定义方法。这个类是纯数据类。

三、它和谁协作

AuthAppConfig持有这个类。AuthAppConfig的oidc字段是这个类的实例。OIDCProviderConfig是providers字段的值类型。SSO认证流程读取这个实例。

四、重要性评级

评级：7分。

理由：这个类是企业认证的顶层开关。enabled决定部署是否支持SSO。providers承载所有企业身份源。所以重要性中上。
