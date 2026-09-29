# deerflow.mcp-档案

## 一、这个包是干什么的

这个包是DeerFlow的"MCP集成"包。

包名是`deerflow.mcp`。源码在`backend/packages/harness/deerflow/mcp/`。MCP是Model Context Protocol。这是一个给AI agent接外部工具的标准协议。

大白话讲。DeerFlow自己带一些内置工具。但用户还想接外部工具。比如Playwright浏览器、数据库客户端。外部工具跑在独立的MCP服务器里。DeerFlow通过这个包发现工具、调用工具、管理连接。

这个包管的事情很多。

- 从`extensions_config.json`读MCP服务器配置。
- 用`langchain-mcp-adapters`连多台服务器。stdio、SSE、HTTP三种传输。
- 把工具装进agent的工具集。工具名加服务器前缀防冲突。
- 给stdio连接维护持久会话池。让Playwright这类有状态服务器在多次调用之间记住状态。
- 管凭证。OAuth令牌、每用户凭证、每请求凭证。
- 把长耗时任务（提交后要跑几分钟的）放进独立的持久任务运行时。
- 支持用户个人的MCP连接。和部署级配置分开。

## 二、包里的主要成员

这个包文件多。按职责分组讲。

### 1、配置与发现

- `client.py`。`build_server_params()`把单台服务器配置变成`MultiServerMCPClient`的参数。`build_servers_config()`处理全部服务器。静态headers里传输层会拒绝的值在这里就被拒绝，并把这个服务器从配置里去掉。
- `config_normalization.py`。共享的配置规范化。MCP工具缓存、自定义拦截器构建器、持久任务配置快照三处必须对"两个配置是否等价"给出一致判断。规则集中在这里防止漂移。
- `cache.py`。工具缓存。工具在首次使用时才通过`get_cached_mcp_tools()`懒加载。失效检测是两阶段的。第一阶段比路径加内容签名`(mtime, size, sha256)`，能抓到同秒编辑、mtime倒退的情况。第二阶段序列化有效MCP切片做比较，这样只改skills或middleware不会退休缓存的工具。`initialize_mcp_tools()`在启动时初始化。发布前比较前后快照，配置在发现期间变了就不发布。
- `tools.py`。最大的文件，约4.7万字节。`get_mcp_tools()`是工具装配主入口。stdio工具被会话池包装。HTTP/SSE工具不包装。还有工具名前缀、stdio工作目录准备、结果里的本地文件路径翻译成`/mnt/user-data/...`、长任务工具的隐藏和替换。

### 2、会话池

- `session_pool.py`。约3.7万字节。`MCPSessionPool`维护持久stdio会话。会话按`(server_name, scope_key, owning_loop)`三键隔离。

核心设计是owner任务模型。MCP的`ClientSession`建在anyio任务组上。anyio要求cancel scope必须由进入它的同一个任务退出。同步工具路径每次调用走全新的`asyncio.run`循环。如果没有owner任务，跨调用退出会话就会崩（GitHub issue #3379）。所以每个池化会话由专属的`_run_session`任务持有。这个任务进入上下文管理器，把活的会话交给调用方，然后等关闭事件。所有关闭路径只发信号。退出永远由owner自己做。进入和退出保证在同一个任务里。

`MAX_SESSIONS`是256的硬上限。LRU逐出。容量检查在创建前和在创建中的会话晋升时都做。晋升时的受害者由独立跟踪的清理任务处理。

- stdio断连恢复。收到MCP SDK的`Connection closed`错误或AnyIO关闭流错误时，只逐出那个确切身份的会话。迟到的旧调用错误不能逐出替代者。

### 3、凭证与拦截器

- `oauth.py`。`OAuthTokenManager`为HTTP/SSE服务器管理OAuth令牌。支持`client_credentials`和`refresh_token`流。自动刷新。用`threading.Lock`而不是asyncio锁，因为内嵌客户端会从多个全新事件循环并发调用。渲染出的`<token_type> <access_token>`经过`illegal_header_value_reason`检查。这是所有路径读令牌值的唯一边界。
- `user_scoped_auth.py`。每用户凭证。服务器声明`user_auth`块，把DeerFlow用户id映射到凭证头。每次工具调用时拦截器解析当前用户并重写头。默认fail closed。未映射的用户拿到的是明确的ToolException，而不是别人的凭证。
- `context_headers.py`。每请求凭证。服务器声明`headers_from_context`块，把HTTP头名映射到运行请求`config.context.secrets`里的键。给多租户网关、按请求换API key的场景用。
- `headers.py`。头名大小写不敏感的写入口。`apply_header_overrides()`大小写不敏感地应用覆盖。`illegal_header_value_reason()`解释一个值为什么不能作为HTTP头发送，而且不回显值本身。这一点很关键。h11会把完整值放进异常消息。工具错误会进入模型可见的消息。不检查的话凭证会泄露进提示词。
- `interceptors.py`。拦截器的统一构建和洋葱式组合。顺序是OAuth、user_auth、context_headers、自定义拦截器。后注册的拦截器跑得离传输层更近，所以它的头写入赢。优先级是静态headers < oauth < user_auth < headers_from_context。
- `personal_network.py`。个人HTTP连接的公网策略。非运维者的个人连接只允许公网地址。用httpx传输层实现。防SSRF。

### 4、用户个人MCP

- `user_config.py`。个人MCP配置存在认证用户根目录下`integrations/mcp.json`。运行时服务器名绑定owner、名字、配置修订版的SHA-256哈希。同名的个人连接不会顶掉部署连接。个人文件只读字面值，不能解析宿主的`$ENV`密钥。
- `user_tools.py`。`get_user_mcp_tools()`只加载调用者本人的个人工具。绝不进部署级全局缓存。每次调用都守卫owner和当前修订版。
- `personal_access.py`。没有`personal_public_network: true`的个人定义，要求当前管理员权限。每次发现和调用都用宿主安装的异步查询。不缓存决策。

### 5、长任务基础

- `task_tool_caller.py`。持久任务用的精确名称调用。后台调用时在用户ContextVar里绑定一个只有ID的`_TaskOwner`。这样`user_auth`能在没有活跃agent运行的情况下选对凭证。stdio连接复用规范的版本化scope。后台HTTP/SSE调用带`user_auth`凭证。不能持久化请求密钥。
- `tasks/`。子包。协议无关的任务驱动契约。单独一份档案。

## 三、它和谁协作

### 1、上游（谁调用它）

实际查证全仓库有74个文件导入`deerflow.mcp`。去掉包自身和测试，生产代码里的主要调用方如下。

- `deerflow.tools.tools`。工具层。把MCP工具合进agent工具集。
- `app.gateway.app`。Gateway。启动时初始化缓存、清理会话池、装配任务运行时。
- `app.gateway.routers.mcp`。MCP配置和缓存重置的HTTP接口。
- `deerflow.agents.middlewares`。工具去重等中间件读MCP元数据。
- `deerflow.mcp_scope`。会话scope键。
- `app.mcp_tasks.service`。持久任务服务消费tasks子包。

### 2、下游（它依赖谁）

- `langchain-mcp-adapters`。`MultiServerMCPClient`和`load_mcp_tools`。
- `mcp`。MCP协议SDK。`ClientSession`。
- `anyio`。任务组。
- `httpx`。HTTP/SSE传输和个人网络策略。
- `deerflow.config`。`ExtensionsConfig`。
- `deerflow.reflection`。加载自定义拦截器。
- `deerflow.runtime.user_context`。解析当前用户。
- `deerflow.community.url_safety`。个人连接的公网校验。

### 3、测试

测试覆盖极厚。`test_mcp_session_pool.py`（26处导入）、`test_mcp_cache.py`、`test_mcp_oauth.py`、`test_mcp_context_headers.py`、`test_mcp_header_names.py`、`test_personal_mcp.py`系列、`test_mcp_task_*`系列、`test_mcp_cwd.py`、`test_mcp_file_migration.py`、`test_mcp_routing_*`系列等。

## 四、重要性评级

评级是8分。

理由如下。

这个包是DeerFlow可扩展性的支柱。内置工具之外的一切外部工具接入都靠它。MCP配置不启用任何服务器时，它安静退场。一旦启用，它处在每次工具调用的路径上。

它被引用的地方非常多。实际查证全仓库有74个文件导入它。是6个包里被引用最多的。

它的代码量大。整个目录约25万字节。19个文件。会话池、缓存失效、凭证拦截器三块都是精心打磨的重逻辑。

删除它会怎样。所有MCP工具接入全部失效。Gateway启动时装配工具集会受影响。持久任务运行时无法工作。用户个人连接无法工作。已启用MCP服务器的部署会立刻退化。只依赖内置工具的部署受影响较小。

为什么是8分不是更高分。MCP是可选项。`extensions_config.json`不配服务器时，系统核心（agent、模型、内置工具）照常运行。它不是发一条消息就必经的路径。

为什么不是更低分。它的引用面、代码量、打磨深度都是6个包里数一数二的。stdio会话池和凭证头安全这两块几乎没有简化空间，出了错都是安全问题。
