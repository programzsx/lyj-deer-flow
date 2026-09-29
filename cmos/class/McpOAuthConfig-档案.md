# McpOAuthConfig档案

一、这个类是干什么的

McpOAuthConfig是MCP服务器的OAuth配置类。适用于HTTP和SSE传输。这个类描述令牌端点、授权类型和令牌解析。这个类继承自pydantic的BaseModel。extra为allow。

二、类的成员

（一）字段

- enabled：布尔值。默认值是True。这个字段表示OAuth令牌注入是否启用。
- token_url：字符串。必填。这个字段是OAuth令牌端点URL。
- grant_type：字面量。取值是client_credentials或refresh_token。默认值是client_credentials。这个字段是OAuth授权类型。
- client_id：字符串或None。默认值是None。这个字段是OAuth客户端ID。
- client_secret：字符串或None。默认值是None。这个字段是OAuth客户端密钥。
- refresh_token：字符串或None。默认值是None。这个字段是refresh_token授权用的刷新令牌。
- scope：字符串或None。默认值是None。这个字段是OAuth范围。
- audience：字符串或None。默认值是None。这个字段是OAuth受众。特定于提供者。
- token_field：字符串。默认值是access_token。这个字段是令牌响应里包含访问令牌的字段名。
- token_type_field：字符串。默认值是token_type。这个字段是包含令牌类型的字段名。
- expires_in_field：字符串。默认值是expires_in。这个字段是包含过期秒数的字段名。
- default_token_type：字符串。默认值是Bearer。这个字段是响应里缺失令牌类型时的默认类型。
- refresh_skew_seconds：整数。默认值是60。这个字段是过期前多少秒刷新令牌。
- extra_token_params：字典。默认值是空字典。这个字段是发给令牌端点的额外表单参数。

（二）方法

这个类没有自定义方法。extra为allow允许提供者私有的额外键。

三、它和谁协作

McpServerConfig持有这个类。McpServerConfig的oauth字段的类型是这个类。OAuth拦截器读取这个实例来获取和刷新令牌。

四、重要性评级

评级：5分。

理由：这个类是MCP服务器的认证挂载点。凭据处理错误会导致认证失败或泄露。但只影响远程MCP服务器。所以重要性中等。
