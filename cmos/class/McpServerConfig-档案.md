# McpServerConfig档案

一、这个类是干什么的

McpServerConfig是单个MCP服务器的配置类。这个类描述一个MCP服务器的传输、命令和凭据。这个类还描述路由提示和任务工具集。这个类继承自pydantic的BaseModel。extra为allow。

二、类的成员

（一）字段

- enabled：布尔值。默认值是True。这个字段表示这个MCP服务器是否启用。
- type：字符串。默认值是stdio。这个字段是传输类型。stdio、sse或http。
- command：字符串或None。默认值是None。stdio类型时启动服务器的命令。
- args：字符串列表。默认值是空列表。传给命令的参数。
- cwd：字符串或None。默认值是None。服务器进程的工作目录。
- env：字典。默认值是空字典。服务器的环境变量。
- url：字符串或None。默认值是None。sse或http类型的服务器URL。
- headers：字典。默认值是空字典。发送的HTTP头。校验器拒绝同一头在两种大小写下重复。
- oauth：McpOAuthConfig或None。默认值是None。OAuth配置。
- user_auth：McpUserScopedAuthConfig或None。默认值是None。按用户的凭据注入。
- headers_from_context：McpContextHeadersConfig或None。默认值是None。按请求的凭据注入。
- description：字符串。默认值是空字符串。服务器提供什么的人类可读描述。
- routing：McpRoutingConfig实例。默认值是默认构造。这个服务器的工具软路由提示。
- tools：字典。键是原始工具名。值是McpToolOverride。默认值是空字典。按工具的配置覆盖。
- tool_name_prefix：布尔值。默认值是True。这个字段表示发现的工具名要不要加服务器名前缀。避免跨服务器冲突。
- tool_call_timeout：浮点数或None。默认值是None。单个stdio工具调用和持久任务调用的超时秒数。None表示没有调用级超时。
- session_init_timeout：浮点数或None。默认值是DEFAULT_MCP_SESSION_INIT_TIMEOUT。这个字段是服务器拉起的超时秒数。包括子进程启动和工具发现。默认值防止挂死的服务器无限阻塞代理构建。
- task_toolsets：McpTaskToolsetConfig列表。默认值是空列表。持久MCP任务运行时管理的submit、status、cancel工具组。

（二）方法

- _validate_header_names：字段校验器。拒绝同一HTTP头在两种大小写下重复映射。重复会让两个凭据都到线上。
- _accept_transport_alias：模型校验器。把MCP规范的transport字段当作type的别名。type优先。
- _validate_task_tool_bindings：模型校验器。确保三个任务工具名在所有工具集和角色间唯一。重复就报错。

三、它和谁协作

ExtensionsConfig持有这个类。ExtensionsConfig的mcp_servers字典的值类型是这个类。McpRoutingConfig、McpOAuthConfig、McpUserScopedAuthConfig、McpContextHeadersConfig、McpToolOverride和McpTaskToolsetConfig是这个类的字段类型。MCP客户端和拦截器读取这个实例。

四、重要性评级

评级：7分。

理由：这个类是MCP扩展的核心配置。传输、凭据和任务绑定都在这里。配置错误会导致凭据泄露或工具失效。所以重要性中上。
