# MCPSessionPool-档案

## 一、这个类是干什么的

MCPSessionPool是mcp/session_pool.py里的类。

它是持久MCP会话池。支撑有状态工具调用。

langchain-mcp-adapters用session=None加载MCP工具时。

每次工具调用创建新MCP会话。

对有状态服务器如Playwright。

浏览器状态、打开的页面、填的表单在调用间丢失。

这个模块提供会话池。

维护持久MCP会话。

按(server_name, scope_key, owning_loop)作用域。

同一loop上的连续调用共享server端状态。

独立loop用独立会话。

sync wrapper每次调用用新loop。

不保留状态。

池达容量时LRU淘汰。

生命周期模型如下。

MCP ClientSession实现在anyio task group上。

anyio强制cancel scope必须从进入它的同一task退出。

从其他task调cm.__aexit__抛RuntimeError。

sync-tool路径每次调用通过fresh asyncio.run驱动。

一个调用中进入的会话会在另一个调用中退出。

从不同task。然后崩。GitHub issue #3379。

为了让这不可能。

每个池化会话由专用_run_session task拥有。

那个task进入context manager。

把活会话交回调用者。

然后在close事件上等待。

所有shutdown路径只signal那个事件。

owner task自己执行__aexit__。

保证enter和exit总在同一task。

owner task也是把创建提升进池的唯一写者。

initialize成功后在_entries注册会话。

在一个原子临界区里resolve创建的future。

调用者只能收到池已拥有的会话。

永不收到生命周期还绑在单个可能被取消的调用者上的会话。

这个类位于backend/packages/harness/deerflow/mcp/session_pool.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、会话作用域

按(server_name, scope_key, owning_loop)作用域。

scope_key来自mcp_session_scope_key。

user_id、thread_id、thread_incarnation。

### 2、owner task生命周期

_run_session task拥有会话。

enter context manager。交回会话。等close事件。

shutdown只signal事件。

owner执行__aexit__。

enter和exit总在同一task。

owner是创建提升进池的唯一写者。

initialize成功后原子注册。

### 3、call_pooled_session_tool

它通过池调用工具。

持久会话的工具调用。

### 4、错误处理

_MCP_CLOSED_STREAM_ERRORS包括ClosedResourceError、BrokenResourceError、EndOfStream。

_is_mcp_transport_disconnect判断传输断连。

断连的会话被驱逐。

_finish_session_cleanup清理。

### 5、单例

get_session_pool返回全局池。

reset_session_pool重置。

## 三、它和谁协作

- McpTaskToolCaller通过池调用持久会话工具。
- langchain_mcp_adapters的会话。
- task_tool的代理。GitHub issue #3379。

## 四、重要性评级

评级是8分。

理由如下。

这个类是有状态MCP工具的会话池核心。

owner task生命周期模型解决anyio cancel scope的同task约束。

GitHub issue #3379的崩溃防护。

owner是创建提升的唯一写者。原子临界区。

LRU淘汰。

作用域按server加scope_key加loop。

这些是有状态工具调用正确性的核心。

扣掉2分。

扣分原因是它是会话机械件。
