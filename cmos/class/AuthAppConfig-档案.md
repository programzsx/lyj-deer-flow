# AuthAppConfig档案

一、这个类是干什么的

AuthAppConfig是DeerFlow应用配置里的认证配置节。这个类聚合两块配置。一块是OIDC SSO。一块是内置邮箱密码认证。这个类继承自pydantic的BaseModel。

二、类的成员

（一）字段

- oidc：OIDCAuthConfig实例。默认值是默认构造。这个字段是OIDC SSO认证设置。
- local：LocalAuthConfig实例。默认值是默认构造。这个字段是内置邮箱密码认证设置。

（二）方法

这个类没有自定义方法。这个类是纯聚合类。

三、它和谁协作

AppConfig持有这个类。AppConfig的auth字段是这个类的实例。OIDCAuthConfig和LocalAuthConfig是这个类的字段类型。认证中间件和登录路由读取这个实例。

四、重要性评级

评级：7分。

理由：认证是部署安全的第一道门。这个类聚合了全部认证配置。配置错误影响登录和安全。所以重要性中上。
