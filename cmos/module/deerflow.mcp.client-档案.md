# deerflow.mcp.client-档案

## 一、这个模块是干什么的

这个模块用langchain-mcp-adapters构建MCP客户端参数。

MCP是Model Context Protocol。DeerFlow通过MCP连接外部工具服务器。一个MCP服务器有传输类型。stdio、sse、http。每种传输需要不同的连接参数。

这个模块把配置转换成langchain-mcp-adapters的MultiServerMCPClient需要的参数字典。

## 二、模块里的主要成员

### 1、build_server_params函数

这个函数构建单个服务器的参数。

函数根据传输类型分支。

stdio传输需要command字段。没有command抛ValueError。参数带command、args、cwd（有配置时）、env（有配置时）。

sse和http传输需要url字段。没有url抛ValueError。参数带url。

personal_public_network为true时。参数带personal_httpx_client_factory。这是个人MCP连接的公网策略客户端工厂。

headers存在时。每个header值先用illegal_header_value_reason检查。值不能作为HTTP头发送时抛ValueError。注释解释了原因。静态配置的值被传输拒绝时得到和请求级值一样的处理。h11在换行或周围空白时把完整值渲染进异常。异常通过ToolErrorHandlingMiddleware到达模型。这些值往往是API密钥。在这里拒绝值得。build_servers_config已经会丢弃这个服务器并记录原因。

其他传输类型抛ValueError。

### 2、build_servers_config函数

这个函数构建全部启用服务器的参数。

从extensions_config取启用的服务器。没有启用的服务器返回空字典。

逐个调用build_server_params。失败的打错误。跳过该服务器。其他服务器继续。

## 三、它和谁协作

tools.py的get_mcp_tools调用build_servers_config。构建MultiServerMCPClient的参数。

task_tool_caller调用build_server_params。为持久任务调用构建连接。

它依赖config的ExtensionsConfig和McpServerConfig。依赖headers的illegal_header_value_reason。依赖personal_network的客户端工厂。

## 四、重要性评级

评级是5分（满分10分）。

理由：

这个模块是MCP连接参数的转换层。配置到客户端参数的映射都在这里。

header值预检查防止密钥通过h11异常泄漏到模型。这是真实的安全细节。

每个服务器独立失败。一个坏服务器不影响其他服务器。

它逻辑量小。86行。主要是分支转换。给5分。
