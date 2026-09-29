# deerflow.mcp.oauth-档案

## 一、这个模块是干什么的

这个模块为MCP的HTTP和SSE服务器提供OAuth token支持。

一个MCP服务器可以配置OAuth。OAuth有token端点流程。client_credentials和refresh_token两种授予类型。自动获取token。缓存。过期前刷新。Authorization头注入。

这个模块管理token的生命周期。获取。缓存。刷新。注入头。

## 二、模块里的主要成员

### 1、_OAuthToken数据类

缓存里的OAuth token。有access_token、token_type、expires_at三个字段。

### 2、OAuthTokenManager类

这是核心类。管理MCP服务器的token获取、缓存、刷新。

构造时接收oauth_by_server映射。为每个服务器创建一个threading.Lock。

锁的类型选择有讲究。注释解释了原因。不用asyncio.Lock。因为嵌入式和TUI的同步工具调用路径每次并发调用都在新事件循环和新OS线程上调用get_authorization_header。asyncio.Lock绑定到第一个争用它的循环。第二个调用者的释放跨循环没有call_soon_threadsafe要么静默死锁要么抛"bound to a different event loop"。threading.Lock没有循环亲和性。可以安全共享。

get_authorization_header是主方法。

token存在且不过期时直接返回。

需要新token时获取锁。锁获取本身用shield保护的显式任务运行。裸的await asyncio.to_thread(lock.acquire)不能安全取消。一旦executor线程开始运行lock.acquire。Python无法停止它。取消 delivered在这个await上。线程还是会继续获取锁。当前协程已经走了。没人调用release。锁永远锁住。之后对这个服务器的每个调用都永久阻塞在同一行。shield保护意味着取消的调用者可以等待那个（不可停止的）获取实际落地并立即释放锁。而不是泄漏锁所有权。

锁内重新检查token。还是新鲜就直接返回。过期就获取新token。

获取流程。构造token请求数据。extra_token_params先展开。保留字段不能被静默覆盖。grant_type设为oauth.grant_type。client_credentials需要client_id和client_secret。refresh_token需要refresh_token。其他授予类型抛错。

httpx.AsyncClient发POST到token_url。15秒超时。

从响应取access_token。取不到抛错。

refresh_token授予时。持久化旋转后的refresh_token。这是进程内更新。故意不写回extensions_config.json。旋转refresh token的供应商（Auth0、Okta、Google等）每次刷新返回新的refresh_token。丢弃它让下一次刷新失败invalid_grant。

token_type和expires_in从响应取。默认3600秒。

### 3、_authorization_value静态方法

渲染Authorization值。拒绝传输会回显的值。

token端点的响应不是这个进程能控制的。access_token或token_type带换行会到达h11。h11抛错时带完整值。ToolErrorHandlingMiddleware把消息复制进模型可见的ToolMessage。在这里失败关闭让token不进提示、检查点、追踪。每个调用者都经过这个边界。工具拦截器。初始发现头。持久任务路径。

渲染值被检查。不是两个字段分别检查。因为渲染值是传输看到的。" abc"作为access_token单独带前导空白。放在"Bearer "之后是合法的。拒绝它会错误地拒绝一个服务器会接受的token。

### 4、_is_expiring静态方法

token过期判断。带refresh_skew_seconds缓冲。

### 5、build_oauth_tool_interceptor函数

这个函数构建注入OAuth Authorization头的工具拦截器。没有OAuth服务器时返回None。

拦截器获取Authorization值。没有头值直接调用handler。有值用apply_header_overrides替换头。带静态头拼写。注入的token替换静态的authorization头。而不是和它一起上线。

### 6、get_initial_oauth_headers函数

这个函数为MCP服务器连接获取初始OAuth Authorization头。用于工具发现和会话初始化。

逐个服务器获取。失败的打警告跳过。

## 三、它和谁协作

interceptors调用build_oauth_tool_interceptor。构建工具拦截器。

tools.py调用get_initial_oauth_headers。注入发现时的初始头。

task_tool_caller持有OAuthTokenManager。为持久任务调用获取Authorization头。

它依赖headers模块的三个函数。依赖httpx发token请求。

## 四、重要性评级

评级是7分（满分10分）。

理由：

OAuth是MCP HTTP/SSE服务器的认证基础。token的获取、缓存、刷新、注入都在这里。

锁的类型选择解释得很细。threading.Lock而不是asyncio.Lock。原因是跨循环跨线程的调用者。

锁获取的shield保护处理了一个真实的死锁风险。不可停止的lock.acquire线程在协程取消后没人释放。shield让取消的调用者等待获取落地并释放。

Authorization值的渲染检查防止token泄漏到模型可见的错误消息。检查渲染值而不是两个字段。这是传输看到的。

refresh_token的进程内旋转处理了令牌轮换。故意不写回配置文件。

它影响每个OAuth服务器的每次工具调用。给7分。
