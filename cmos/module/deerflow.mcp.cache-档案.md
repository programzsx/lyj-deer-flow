# deerflow.mcp.cache-档案

## 一、这个模块是干什么的

这个模块缓存MCP工具。避免重复加载。

MCP工具的加载是重操作。每个stdio服务器要spawn子进程。initialize。tools/list。OAuth token要获取。缓存避免每次调用都做这些。

缓存不是简单的。配置文件可以在运行时被Gateway API修改。缓存要检测变化。变化了重新加载。同时要区分真实变化和无关变化。技能开关、中间件设置的变化不触发重建。只有MCP配置本身的变化才触发。

## 二、模块里的主要成员

### 1、缓存状态

模块维护多个全局状态。

_mcp_tools_cache是缓存的工具列表。

_cache_initialized是初始化标志。

_init_lock是RLock。守护缓存状态转换。

_init_condition是Condition。基于_init_lock。

_initializing_generation是初始化中的代次。

_cache_generation是缓存代次。每次重置加一。

_config_path和_config_signature是初始化时记录的配置路径和签名。

_mcp_config_snapshot是发布工具时基于的MCP切片JSON快照。可能包含解析的凭据。留在进程内存。从不记录或持久化。

_initialized_without_config区分两个状态。初始化时无配置发布的缓存。后来配置出现了必须被捡起来。配置删除后最后已知的好缓存保持fail-soft。

### 2、_resolve_config_path函数

解析extensions配置文件路径。未配置返回None。

ExtensionsConfig.resolve_config_path()在显式路径指向的文件缺失时抛FileNotFoundError。这对实际使用配置的调用者是故意的。操作员断言的路径缺失是真实的配置错误。必须响亮。

这个helper不是那些调用者。它只支撑缓存自己的staleness检查。这个检查在每次get_cached_mcp_tools()调用上跑。只想知道之前加载的配置是否仍然当前。之前有效的显式路径后来不可读时。抛错会崩溃每个后续调用。而不是让缓存提供最后已知的好工具。所以这个包装捕获那个特定失败。视为"未配置"。匹配_is_cache_stale()现有的fail-soft处理。

### 3、_effective_mcp_config_snapshot函数

序列化extensions配置的MCP-only切片。

extensions_config.json还携带skills和中间件设置。整个文件签名无法区分MCP变化和技能开关。启用服务器列表保留声明顺序。sort_keys只规范化每个服务器的字段顺序。解析的模型通过normalize_mcp_server_config比较。等价的type/transport拼写。自定义拦截器列表通过normalize_mcp_interceptor_paths比较。

结果是JSON。可能包含解析的凭据。留在进程内存。从不记录或写回磁盘。

### 4、_is_cache_stale函数

检查缓存是否因配置文件变化而过期。

检查的信号有两个。配置路径。配置签名。mtime、大小、SHA-256。

用内容相等而不是严格mtime大于比较。检测同秒编辑。mtime不动或倒退。git checkout。cp -p、备份恢复。tar、rsync保留时间戳。切换到不同配置文件但mtime相同或更旧。

信号触发时重新读有效MCP切片。切片不变时采纳新签名。返回False。所以这个函数不是只读谓词。生产调用者在_init_condition下运行。

配置缺失或未记录时不失效。fail-soft。配置删除后缓存继续提供最后已知的好MCP工具。

未配置初始化后配置出现。缓存过期。必须捡起来。

### 5、initialize_mcp_tools函数

初始化并缓存MCP工具。应用启动时调用一次。

实现用了代次机制防止并发初始化。在初始化中的代次记录下来。其他调用者等待。初始化失败释放代次。通知等待者。

读取确切交给发现的修订。读前后的文件快照单独比较无法证明哪个修订产出了工具。get_mcp_tools()会自己读文件。

发布只在当前配置的有效MCP快照仍等于产出工具的快照时。否则重置缓存。重置走和正常过期失效一样的会话池退休路径。等待者重试。

这关闭了发现窗口。基于被取代的MCP修订构建的工具。或基于签名无法重读的路径构建的工具。永远不发布。发现期间的skills-only编辑仍然发布。因为MCP切片没变。

### 6、get_cached_mcp_tools函数

获取缓存的MCP工具。带懒初始化。

每次调用检查缓存是否过期。过期就重置重新初始化。这保证Gateway API的修改反映到Gateway嵌入的LangGraph运行时。

初始化的循环回退。只有get_event_loop()抛异常时回退到asyncio.run。initialize_mcp_tools()自己抛的RuntimeError不能触发第二次发现。第二次发现会重新spawn每个stdio服务器。重新获取OAuth token。

### 7、refresh_mcp_cache_if_active函数

退役过期的缓存状态。不懒初始化工具。

工具组装在没有MCP服务器启用时跳过get_cached_mcp_tools()。配置变化禁用最后一个服务器时。之前的池和它的持久会话会活着。这个入口只做staleness检查。没初始化且无初始化中的进程立即返回。不付配置哈希成本。

### 8、reset_mcp_tools_cache函数

重置缓存。测试用或想重载MCP工具。也关闭所有持久MCP会话。

关闭所有持久会话。下次get_mcp_tools()用可能更新的连接配置重建。

close_all_sync()已经按owning loop选正确的策略。当前运行循环上的会话只发信号。别的线程循环上的确定拆卸。空闲关闭的循环处理或跳过。故意不试图同步等待当前运行循环完成拆卸。那是自死锁。循环只能在这个同步调用返回控制给它之后运行拆卸。

重置在_init_condition下先退休会话池。再重置缓存状态。否则并发初始化者会对即将分离的池构建工具包装。在重置替换单例后发布它们。

### 9、_reset_mcp_tools_cache_state_and_retire_pool_locked函数

在锁下退休会话池和重置缓存状态。工具包装器在构建时闭包模块级会话池单例。任何使缓存失效的路径必须先换单例。等待者和新初始化者再重建包装器。

## 三、它和谁协作

tools.py的get_cached_mcp_tools从这里拿缓存工具。

session_pool在缓存重置时被退休。

Gateway的MCP配置路由在更新时调用reset_mcp_tools_cache。

config_normalization提供等价性规则。file_signature提供配置签名。

它依赖ExtensionsConfig读配置。依赖session_pool管理会话。

## 四、重要性评级

评级是8分（满分10分）。

理由：

cache是MCP工具的缓存层。避免每次调用重新spawn服务器。这是性能关键。

过期检测的设计非常细。配置路径加内容签名。MCP-only切片比较。技能切换不触发重建。等价拼写不触发重建。两个无配置状态区分。未验证签名不发布不采纳。

代次机制处理并发初始化。初始化中的代次被 invalidated。基于被取代修订构建的工具永不发布。

发布的前后快照比较关闭了发现窗口。读取确切交给发现的修订。

会话池退休和缓存重置在同一把锁下。防止包装器闭包旧池。

它影响每个MCP工具的加载性能和正确性。给8分。
