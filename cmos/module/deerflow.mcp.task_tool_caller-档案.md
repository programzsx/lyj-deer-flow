# deerflow.mcp.task_tool_caller-档案

## 一、这个模块是干什么的

这个模块实现持久ordinary-task驱动使用的精确名字MCP调用。

MCP服务器可以配置task_toolsets。绑定原始的submit、status、cancel工具名。持久任务运行时在Agent循环外驱动status和cancel调用。这些调用不能用普通工具包装。需要独立的调用器。

这个模块提供McpTaskToolCaller。它调用配置的原始MCP工具。不把它们暴露回Agent。

## 二、模块里的主要成员

### 1、_TaskOwner数据类

只带ID的CurrentUser。用于背景MCP认证。没有个人资料或角色数据。

背景调用绑定这个owner。让user_auth能选择配置的凭据。没有活跃的Agent运行。

### 2、_prepare_stdio_connection函数

为stdio连接准备线程工作目录。

确保线程目录存在。工作目录。临时目录。临时目录mkdir。chmod 0o700。连接的cwd默认设为工作目录。env默认设TMPDIR、TMP、TEMP为临时目录。

stdio MCP服务器的子进程运行在线程的挂载树里。产出的文件落在可服务的位置。

### 3、McpTaskToolCaller类

这是核心类。调用配置的原始MCP工具。不暴露回Agent。

构造时接收extensions_config。创建OAuthTokenManager。构建拦截器。

拦截器构建有一个细节。submit链和背景链。submit是内联在Agent运行里的。config.context.secrets仍然可通过环境LangGraph运行时到达。submit用调用者自己的凭据出去。后面的status和cancel轮询由任务运行时驱动。在Agent运行结束之后。没有运行上下文可读。失败关闭的拦截器会拒绝每个轮询。那些用配置的凭据。包括持久任务所有者的user_auth。这是build_context_headers_interceptor在启动时警告的。

所以两链共享同一个拦截器顺序和自定义builder。但背景链去掉context_headers拦截器。

call_tool方法。

connection_scope为personal时。为所有者和服务器名拿个人调用者。检查管理员权限。调用个人调用者的_call_configured_tool。

connection_scope为deployment时。直接调用_call_configured_tool。

个人调用者缓存。每个用户一个。LRU最多128。缓存保留个人凭据和OAuth状态在内存。_personal_caller_for在锁下检查文件变化。配置变了重建调用者。

_call_configured_tool方法。

从配置拿服务器。找不到或禁用抛LookupError。

构建连接参数。

计算scope_key。用mcp_session_scope_key。带user_id、thread_id、thread_incarnation。

stdio传输。准备连接。获取池化会话。session_init_timeout有时带超时。调用_invoke。

HTTP/SSE传输。获取OAuth Authorization头。有头时替换连接的headers。用户凭据背景调用需要环境owner。调用_invoke。

_invoke方法。

构建execute处理器。持久会话时。转发拦截器头为调用元数据。调用call_pooled_session_tool。

临时会话时。有效连接的headers用apply_header_overrides替换。一个asyncio.timeout(session_init_timeout_seconds)覆盖传输上下文进入和MCP初始化。报告服务器和配置的上限。初始化超时后禁用它。工具调用有自己的独立超时。

拦截器按洋葱式组合。背景调用绑持久任务owner。保持submit上下文不动。ContextVar状态让不同用户的并行轮询隔离。

## 三、它和谁协作

mcp目录的ordinary任务驱动用McpTaskToolCaller调用status和cancel。submit也可能用它。

它依赖client的build_server_params。依赖headers的apply_header_overrides。依赖interceptors的build_mcp_tool_interceptors。依赖oauth的OAuthTokenManager和build_oauth_tool_interceptor。依赖personal_access的require_personal_mcp_access。依赖session_pool的三个函数。依赖user_config的读取函数。

它依赖mcp_scope的会话scope key。依赖runtime.user_context的set_current_user和reset_current_user。

## 四、重要性评级

评级是6分（满分10分）。

理由：

这个模块是持久MCP任务的调用层。status和cancel调用在Agent循环外驱动。需要独立的调用器。

两链设计细。submit链带context_headers拦截器。背景链去掉。submit在Agent运行内。背景在Agent运行外。凭据来源不同。

stdio连接的准备工作目录。cwd和临时目录钉在挂载树里。产出的文件可服务。

scope_key带thread_incarnation。版本化的编码。 incarnation的语义在mcp_scope里。

个人调用者缓存LRU 128。文件变化重建。

它影响持久MCP任务的每次调用。给6分。
