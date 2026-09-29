# McpContextHeadersConfig档案

一、这个类是干什么的

McpContextHeadersConfig是MCP服务器的按请求凭据注入配置类。适用于HTTP和SSE传输。这个类把HTTP头名映射到运行请求的config.context.secrets的键。调用方每次运行自己提供凭据。不是按配置的用户提供。这个类不存储凭据。只存头名和运行上下文键名。所以可以不脱敏地从配置API返回。这个类继承自pydantic的BaseModel。extra为allow。

二、类的成员

（一）字段

- enabled：布尔值。默认值是True。这个字段表示按请求的头注入是否启用。
- headers：字典。键是HTTP头名。值是从config.context.secrets读取的键。默认值是空字典。例如X-Tenant-Id映射到tenant_id。
- on_missing：字面量。取值是deny或passthrough。默认值是deny。这个字段是映射键在请求secrets里缺席时的行为。deny表示失败并报可操作的错误。passthrough表示转发请求带服务器静态头。

（二）方法

- _validate_mapping_entries：字段校验器。这个方法拒绝空白头名。拒绝空白secret键。拒绝同一HTTP头在两种大小写下重复映射。HTTP字段名不区分大小写。

三、它和谁协作

McpServerConfig持有这个类。McpServerConfig的headers_from_context字段的类型是这个类。内置的上下文头拦截器在每次工具调用时解析映射。运行请求的secrets载体提供值。

四、重要性评级

评级：5分。

理由：这个类实现按请求的凭据传递。不存储凭据所以安全。映射错误会让请求缺凭据。所以重要性中等。
