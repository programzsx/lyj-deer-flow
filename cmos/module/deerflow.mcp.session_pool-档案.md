# deerflow.mcp.session_pool-档案

## 一、这个模块是干什么的

这个模块为有状态工具调用提供持久MCP会话池。

MCP工具用langchain-mcp-adapters加载时session=None。每次工具调用创建新会话。对有状态服务器比如Playwright。这意味着浏览器状态（打开的页面、填的表单）在调用之间丢失。

这个模块提供会话池。会话按（server_name、scope_key、owning_loop）三元组持久化。同一循环上的连续调用共享服务器端状态。独立循环用独立会话。池达到容量时LRU淘汰。

## 二、模块里的主要成员

### 1、生命周期模型

MCP的ClientSession建立在anyio任务组上。anyio强制取消范围必须由进入它的同一个任务退出。从别的任务调用__aexit__抛RuntimeError。

同步工具路径每次调用用新的asyncio.run循环。一个调用中进入的会话会在另一个调用中退出。从不同任务。会崩溃（issue #3379）。

解决方案是每个池化会话由专用的_run_session任务拥有。那个任务进入上下文管理器。把活会话交回调用者。然后等待关闭事件。所有关闭路径只发信号。owner任务自己执行__aexit__。保证进入和退出永远在同一个任务。

owner任务也是唯一把创建提升进池的写者。初始化成功后在_entries注册。在一个原子临界区里解析创建的future。调用者只能收到池已拥有的会话。永远不是生命周期还绑在单个调用者身上的会话。

### 2、MCPSessionPool类

这是核心类。

MAX_SESSIONS是256。LRU注册表的硬上限。SESSION_CLOSE_TIMEOUT是5秒。在别人的循环上关会话时等待的超时。

_entries是有序字典。键是三元组。值是（session、owning_loop、owner_task、close_event）。

_inflight是进行中的创建。键是三元组。值是（loop、ready_future、owner_task、close_event）。同一循环上的并发调用者共享一个创建。

_lock是threading.Lock。不绑定任何事件循环。可以安全从异步路径和同步worker路径获取。

_teardown_tasks是强引用的拆卸reaper任务集合。事件循环只对任务保持弱引用。不持有的reaper可能被垃圾回收。拆卸还没完成。

get_session方法是获取或创建。

Phase 1在线程锁下决定三种结果之一。返回已有会话。加入进行中的创建。成为创建者。LRU淘汰也在这一步。

Phase 2拆卸被淘汰的会话。先信号每个被移除的owner。信号循环没有await。原子完成。然后await同循环拆卸。别人的循环owner在自己的循环上完成。

Phase 2b加入进行中的创建。结果被创建者的owner任务在提交临界区解析。

Phase 3等待自己的owner任务提交。成功结果意味着会话已在_entries注册。

### 3、_run_session方法

owner任务。进入上下文管理器。初始化。提交。等待关闭信号。

提交临界区里。运行数达到容量时LRU淘汰。淘汰的受害者被信号。owner不await受害者。阻塞的受害者退出不能阻止自己的关闭或断连恢复。

### 4、清理方法

close_scope按scope_key关闭。close_session按服务器和scope关闭。close_server按服务器关闭。close_all关闭全部。

close_session_if_current只关闭注册表里还是同一会话的条目。防止旧并发调用的错误驱逐它的替代。

close_all_sync同步关闭。当前运行循环上的会话只发信号。不能阻塞等待。否则自死锁。别的循环上的等待完成。空闲循环的处理或跳过。

### 5、_is_mcp_transport_disconnect函数

判断错误是否是MCP传输断连。AnyIO关闭流错误或MCP的Connection closed错误。

call_pooled_session_tool在断连时创建清理任务。驱逐精确的会话身份。旧并发调用的错误不能驱逐替代或新的进行中创建。失败调用仍然呈现原始错误。不自动重放。

### 6、进程级单例

get_session_pool返回全局单例。在锁下构建和返回。竞争的冷启动调用者精确构建一个池。reset_session_pool不能在读取和返回之间把全局置None。

reset_session_pool重置单例。返回退休的池。

## 三、它和谁协作

tools.py的_make_session_pool_tool包装stdio工具。用call_pooled_session_tool和get_session_pool。

task_tool_caller为持久任务调用获取池化会话。

cache模块在缓存重置时调用reset_session_pool。退休池。

它依赖langchain_mcp_adapters的create_session。依赖anyio。依赖mcp库。

## 四、重要性评级

评级是8分（满分10分）。

理由：

session_pool解决了一个真实的、隐蔽的问题。anyio取消范围必须由同一个任务退出。同步工具路径每次调用用新循环。不解决的话有状态服务器崩溃（issue #3379）。

owner任务模型设计得非常细。进入和退出永远在同一个任务。提交临界区原子化提升和future解析。受害者拆卸独立进行。owner不await受害者。

并发场景考虑充分。同循环调用者共享创建。别的循环保留独立会话。错误驱逐精确身份。取消处理覆盖三种情况。

拆卸reaper的强引用防止任务被垃圾回收。

它影响每个有状态MCP服务器的每次工具调用。给8分。
