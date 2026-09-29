# deerflow.mcp.tools-档案

## 一、这个模块是干什么的

这个模块用langchain-mcp-adapters加载MCP工具。带stdio会话池化。

它是MCP工具加载的主入口。get_mcp_tools从启用服务器加载工具。stdio工具用持久会话包装。HTTP/SSE工具不包装。

它做很多事。构建连接参数。注入OAuth初始头。构建拦截器。加载各服务器工具。给工具打标签。解析有效路由。配置任务工具。把本地路径引用翻译成虚拟路径。转换调用结果。支持同步调用。

## 二、模块里的主要成员

### 1、工具名验证

_VALID_MCP_TOOL_NAME正则^[A-Za-z0-9_-]+$。

MCP工具名从外部（潜在敌对或被攻陷的）服务器原样到达。工具名只是函数标识。供应商的函数调用API在绑定时验证同样的字符集。但延迟（tool_search）MCP工具被扣留不绑定。供应商检查不在它们的名字上跑。它们只活在系统提示字符串里。名字可以是新行、markdown、尖括号。可以伪造框架提示结构。在加载边界规范化约束绑定的和延迟的名字到同一个安全标识符字符集。

### 2、本地路径翻译

_MCaTool_LOCAL_PATH_IN_TEXT_RE正则匹配本地文件引用。POSIX绝对路径。file:// URI。Windows盘符绝对路径。相对路径。

_local_uri_to_virtual_path函数把本地文件引用翻译成/mnt/user-data/...虚拟路径。stdio MCP服务器的cwd和临时目录钉在挂载树里。工具产出的文件已经活在某处。沙箱和工件API可以服务。只差虚拟前缀。这是纯确定性的主机到虚拟映射。不复制。不信任根列表。不暴露挂载树外的文件。

重写只在引用解析到线程挂载树内已存在文件时发生。过热匹配是良性的。保持原样。

_rewrite_unique_bare_filenames处理裸文件名。只有唯一匹配时重写。

_rewrite_changed_paths_with_spaces处理带空格的路径。

_convert_call_tool_result把MCP CallToolResult转换成LangChain content_and_artifact格式。转换时翻译本地路径。

### 3、_convert_call_tool_result函数

实现与适配器相同的转换逻辑。不依赖langchain_mcp_adapters的私有符号。

TextContent转文本块。ImageContent转图像块。ResourceLink转URL块。EmbeddedResource转文本或文件块。

isError时抛ToolException。

structuredContent存在时放artifact。

### 4、_make_session_pool_tool函数

包装MCP工具。用池化持久会话。

scope_key带user_id和thread_id。文件系统隔离是按（user_id、thread_id）。单独thread_id可能让两个用户共享一个有状态会话。

thread_incarnation从运行时取。

stdio时。准备stdio工作空间。目录创建。临时目录准备。调用前快照。全部同步文件工作打包。离环运行。

配置的cwd存在时用它。否则默认工作目录。

env的TMPDIR、TMP、TEMP设为临时目录。合并操作员提供的env。

session_init_timeout有时。用asyncio.wait_for包装get_session。取消安全。MCPSessionPool.get_session拥有卡在创建中的会话的拆卸。

工具调用超时有时。加read_timeout_seconds。

拦截器存在时。构建base_handler。转发拦截器注入的头。stdio MCP调用。compose_tool_interceptors组合。调用结果转换。

结果转换离环运行。

### 5、_make_background_submit_tool函数

构建背景提交工具。任务提交包装。返回DeerFlow任务ID。状态轮询自动处理。

### 6、_configure_task_tools_for_server函数

隐藏驱动only工具。替换submit为持久包装。

task_toolsets绑定的原始名。隐藏status和cancel。替换submit。配置错误时抛McpTaskConfigurationError。

### 7、get_mcp_tools函数

这是主入口。

langchain-mcp-adapters未安装时打警告返回空列表。

extensions_config为None时。用ExtensionsConfig.from_file()。读最新配置。Gateway API的修改立即反映。需要证明哪个修订产出工具的调用者传快照实例。

personal_user_id为None时。validate_mcp_task_config_snapshot。验证任务配置快照。

有personal_user_id时。读个人配置。和extensions_config比较。不同抛McpTaskConfigurationError。authorized_personal_config省略特权连接。task_toolsets需要平台的持久任务运行时。

构建服务器配置。注入初始OAuth头。带大小写不敏感写。

构建工具拦截器。

创建MultiServerMCPClient。

load_server_tools逐个服务器加载。工具名前缀有时用client.get_tools。没有时用load_mcp_tools直接调用。

session_init_timeout有时。超时工具发现。stdio服务器spawn加initialize加tools/list。一个慢服务器不阻止其他服务器。取消安全。stdio_client的finally关闭stdin。优雅退出。升级到进程树终止。npx子进程和它spawn的子进程被收割。

每个服务器独立失败。跳过该服务器。其他服务器继续。

逐服务器处理工具。验证工具名。无效的丢弃。打MCP标签。打路由标签。stdio工具用_make_session_pool_tool包装。HTTP/SSE工具不包装。HTTP/SSE传输用anyio任务组。不能从不同的异步任务关闭。

服务器独立处理。一个坏的MCP服务器不阻止健康服务器贡献工具。

同步调用支持。DeerFlow客户端同步流。tool.func为None且coroutine存在时。用make_sync_tool_wrapper设置。

## 三、它和谁协作

cache模块从这里初始化缓存工具。

session_pool提供持久会话。

task_tool_caller用它的辅助函数。

它依赖client构建参数。依赖headers替换头。依赖interceptors和oauth构建拦截器。依赖config_normalization。依赖mcp_scope的会话scope。

它依赖tasks目录的任务运行时。

## 四、重要性评级

评级是8分（满分10分）。

理由：

tools是MCP工具加载的主入口。所有MCP工具从这里来。

本地路径翻译的设计很细。过热匹配是良性的。保留原样。裸文件名只有唯一匹配时重写。带空格路径在明确文本边界时重写。

会话池包装的设计细。scope_key带user_id和thread_id。cwd和临时目录钉在挂载树里。取消安全。超时和会话池协作。

工具名验证防止伪造框架提示结构。每个服务器独立失败。一个坏服务器不阻止健康服务器。

任务工具的配置和替换。隐藏驱动only工具。替换submit为持久包装。

它是MCP工具加载的正确性和安全性关键路径。给8分。
