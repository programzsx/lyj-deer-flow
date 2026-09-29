# McpUserScopedAuthConfig档案

一、这个类是干什么的

McpUserScopedAuthConfig是共享MCP服务器的按用户凭据注入配置类。适用于HTTP和SSE传输。这个类把DeerFlow用户ID映射到凭据头值。一个配置的MCP服务器可以服务多个用户。每个用户用自己的凭据认证到远程服务。这个类继承自pydantic的BaseModel。extra为allow。

二、类的成员

（一）字段

- enabled：布尔值。默认值是True。这个字段表示按用户凭据注入是否启用。
- header：字符串。默认值是Authorization。这个字段是要设置用户凭据的HTTP头。校验器拒绝空白。
- users：字典。键是DeerFlow用户ID。值是完整凭据头值。例如Bearer加token。默认值是空字典。值支持$ENV_VAR引用。
- on_missing：字面量。取值是deny或passthrough。默认值是deny。这个字段是调用用户没有映射凭据时的行为。deny表示失败并报可操作的错误。passthrough表示转发请求带服务器静态头。

（二）方法

- _validate_header_not_blank：字段校验器。这个方法拒绝空白的header。

三、它和谁协作

McpServerConfig持有这个类。McpServerConfig的user_auth字段的类型是这个类。内置的用户范围认证拦截器读取这个实例。每个工具调用注入认证用户的凭据。

四、重要性评级

评级：6分。

理由：这个类处理多用户的凭据隔离。deny默认值是安全兜底。配置错误会导致凭据串用。所以重要性中等偏上。
