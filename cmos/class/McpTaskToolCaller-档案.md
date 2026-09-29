# McpTaskToolCaller档案（task_tool_caller模块版本）

## 一、这个类是干什么的

这个类是`deerflow.mcp.task_tool_caller`模块的核心类。

注意。DeerFlow里有两个同名类。这份档案讲的是`mcp.task_tool_caller`模块的版本。另一个同名类在`mcp.tasks.ordinary`模块里。两者的区别在后面说明。

这个类的作用是调用配置好的原始MCP工具，同时不把这些工具暴露回给Agent。

类文档写的是"Call configured raw MCP tools without exposing them back to the Agent"。意思是调用配置的原始MCP工具，但不把它们暴露回给Agent。

背景是这样的。

DeerFlow支持长时运行MCP任务。

管理员在`extensions_config.json`里为服务器配置`task_toolsets`。这里绑定原始的提交、状态、取消工具名。

这些原始工具不能直接暴露给Agent。Agent只看到包装后的提交工具。

`McpTaskToolCaller`是包装器背后的执行者。这个类负责真正发起MCP调用。

模块docstring写的是"Exact-name MCP calls used by the durable ordinary-task driver"。意思是持久普通任务驱动使用的精确名称MCP调用。

这个类的使用场景是持久任务运行时。提交、状态查询、取消三种调用都经过这个类。mcp的AGENTS.md说明stdio任务调用恢复与普通调用相同的规范会话作用域。HTTP和SSE调用保持临时会话。

## 二、类的成员

### 1、字段

- `_extensions_config`：启动时的`ExtensionsConfig`快照。
- `_personal_callers`：有序字典。键是用户ID。值是配置快照和调用器的二元组。缓存个人配置调用器，上限128个。缓存的内容留在内存里。缓存里有个人凭证和OAuth状态，不能记录日志。
- `_personal_callers_lock`：线程锁。保护`_personal_callers`。
- `_oauth_token_manager`：`OAuthTokenManager`实例。
- `_submit_interceptors`：提交链路的拦截器列表。包含OAuth拦截器和上下文头拦截器。
- `_interceptors`：后台链路的拦截器列表。不含上下文头拦截器。源码注释解释了原因。提交调用在Agent的工具调用里被同步等待，`config.context.secrets`还能通过运行时读到。状态和取消轮询由任务运行时驱动，远在Agent运行结束之后。没有运行上下文可读。fail-closed拦截器会拒绝每次轮询。所以后台调用使用配置凭证。

### 2、公开方法

- `call_tool`：这是核心公开方法。关键字参数有服务器名、工具名、参数、用户ID、线程ID、线程化身、`request_scoped_headers`、`connection_scope`。输出是MCP调用结果。流程是这样的。第一步，`connection_scope`是`"personal"`时，加载个人配置调用器。加载用`asyncio.to_thread`，避免阻塞。然后检查个人MCP访问权限。最后委托给个人调用器。第二步，`connection_scope`是`"deployment"`时，直接调用`_call_configured_tool`。第三步，其他作用域值抛出`ValueError`。文档说明了两个要点。`request_scoped_headers`只允许持久提交使用。`connection_scope`被捕获在任务绑定里，相同的部署服务器名不能改变属主。

### 3、内部方法

- `_personal_caller_for`：同步方法。输入是用户ID和服务器名。输出是个人配置的`McpTaskToolCaller`。这个方法带锁运行。先查缓存。文件变了就重载配置。服务器缺失或禁用就抛`LookupError`。缓存未命中就新建调用器。缓存超上限就按LRU淘汰。
- `_call_configured_tool`：异步方法。输入是调用参数。输出是MCP调用结果。这个方法按传输类型分两条路。stdio路径会准备工作目录和临时目录，然后走会话池。HTTP和SSE路径会先拿OAuth授权头，再走临时会话。
- `_invoke`：异步方法。这是最底层的执行方法。流程是这样的。第一步，构造`execute`处理函数。持久会话调用`call_pooled_session_tool`。临时会话用`create_session`建立连接。初始化超时用`asyncio.timeout`约束。工具调用有自己的独立超时。第二步，把拦截器从外到内套在处理函数上。第三步，后台调用需要用户身份时，把`_TaskOwner`绑定到ContextVar。finally里恢复原上下文。

### 4、stdio连接准备

`_prepare_stdio_connection`模块级函数配合这个类。这个函数做三件事。第一件是确保线程目录存在。第二件是把工作目录设为线程沙箱目录，条件是操作者没有显式配置`cwd`。第三件是把`TMPDIR`、`TMP`、`TEMP`环境变量指向`workspace/.mcp/tmp/`，条件是操作者没有显式配置。`.mcp`是DeerFlow拥有的内部命名空间。

## 三、它和谁协作

这个类和以下对象协作。

- `OrdinaryMcpTaskDriver`：上游调用方。驱动通过`call_tool`发起真实调用。
- `MCPSessionPool`：stdio路径的会话池。这个类通过`get_session_pool`拿全局池。
- `OAuthTokenManager`：HTTP和SSE路径的令牌管理。
- `PersonalMcpConfigSnapshot`和`load_user_mcp_config_if_changed`：个人配置来源。
- `require_personal_mcp_access`：个人连接的权限检查。
- `_TaskOwner`：后台调用的身份载体。
- `build_server_params`、`build_mcp_tool_interceptors`、`build_context_headers_interceptor`、`build_oauth_tool_interceptor`：构建连接参数和拦截器链。
- `mcp_session_scope_key`：构造会话隔离键。
- `set_current_user`和`reset_current_user`：绑定和恢复用户上下文。
- `langchain_mcp_adapters`：底层的MCP会话和请求类型。

## 四、重要性评级

评级：9分。

理由如下。

这个类是持久MCP任务的实际执行者。提交、状态查询、取消三种调用全部经过这个类。没有这个类，持久任务运行时就无法触达远端MCP工具。

这个类处理了大量安全边界。提交和后台调用的凭证分离、个人连接的权限检查、stdio工作目录固定、OAuth头注入。AGENTS.md把多个设计边界归到这个类上。

这个类的状态查询和取消链路是长时任务运行时的命脉。Agent回合结束后，只有这个类还在工作。

如果删掉这个类，长时任务功能完全失效。任务提交后无人跟进状态。取消也无法传达。

不给满分的原因是。这个类是执行层。协议契约在`ordinary.py`里。运行时调度在`McpTaskService`里。这个类不拥有协议定义。

所以这个类给9分。
