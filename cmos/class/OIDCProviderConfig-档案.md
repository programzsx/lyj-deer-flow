# OIDCProviderConfig档案

一、这个类是干什么的

OIDCProviderConfig是单个OIDC身份提供者的配置类。提供者可以是Keycloak、Google、Azure AD等。这个类描述一个提供者的全部连接和策略设置。这个类继承自pydantic的BaseModel。

二、类的成员

（一）字段

- display_name：字符串。必填。这个字段是登录按钮上显示的人类可读名字。
- issuer：字符串。必填。这个字段是OIDC发行者URL。
- client_id：字符串。必填。这个字段是提供者分配的OAuth2客户端ID。
- client_secret：字符串或None。默认值是None。这个字段是OAuth2客户端密钥。支持$ENV_VAR引用。
- redirect_uri：字符串或None。默认值是None。这个字段是认证后提供者回调的URL。
- scopes：字符串列表。默认值是openid、email和profile。这个字段是要请求的OIDC范围。必须包含openid。
- token_endpoint_auth_method：字面量。取值是client_secret_post、client_secret_basic或none。默认值是client_secret_post。这个字段是客户端在令牌端点的认证方式。
- auto_create_users：布尔值。默认值是True。这个字段表示首次SSO登录时自动创建DeerFlow用户。
- require_verified_email：布尔值。默认值是True。这个字段表示提供者未报告邮箱已验证时拒绝认证。
- allowed_email_domains：字符串列表。默认值是空列表。非空时只允许邮箱域名在列表里的用户。
- admin_emails：字符串列表。默认值是空列表。这些邮箱的用户首次登录时自动获得admin角色。
- pkce_enabled：布尔值。默认值是True。这个字段表示授权码流程是否启用PKCE。
- nonce_enabled：布尔值。默认值是True。这个字段表示ID令牌里是否包含并校验nonce声明。
- authorization_endpoint、token_endpoint、userinfo_endpoint、jwks_uri：字符串或None。默认值是None。这四个字段用于非标准发现端点的提供者覆盖端点地址。

（二）方法

这个类没有自定义方法。这个类是纯数据类。

三、它和谁协作

OIDCAuthConfig持有这个类。OIDCAuthConfig的providers字典的值类型是这个类。SSO登录流程读取这个实例来发起认证和创建用户。

四、重要性评级

评级：7分。

理由：这个类是企业SSO的核心配置。认证是否安全取决于pkce、nonce和邮箱验证策略。配置错误会导致认证漏洞或用户无法登录。所以重要性中上。
