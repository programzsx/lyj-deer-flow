# deerflow.mcp.context_headers-档案

## 一、这个模块是干什么的

这个模块为共享MCP服务器提供请求级凭据注入。

user_auth把凭据绑定到配置的DeerFlow用户。这强制一个凭据一个MCP服务器条目。但凭据有时是调用方在请求时选的。多租户网关。每次运行的API key。这种场景一个条目一个凭据不现实。

这个模块堵住这个缺口。一个服务器通过声明headers_from_context块来启用。块把HTTP头名映射到运行请求的config.context.secrets载体的键。每次工具调用拦截器从实时运行上下文解析映射。重写那些头。

密钥值随运行请求带外到达。留在那里。不渲染进提示、工具参数、追踪载荷。配置里只放名字。不落盘凭据。

在interceptors.py里最后注册。所以服务器声明多个凭据来源时请求级值赢最终header。

## 二、模块里的主要成员

### 1、_current_runtime函数

尽力访问当前工具调用的LangGraph运行时。

get_runtime()在运行时上下文之外（嵌入式客户端、单元测试、发现路径）抛异常。失败只意味着请求没有可解析的密钥。调用方通过on_missing处理。

### 2、_request_secrets函数

返回运行请求的config.context.secrets。没有返回空字典。

优先用请求上附着的runtime。LangGraph的工具节点把ToolRuntime注入任何名为runtime的工具参数。覆盖池化的stdio包装和langchain_mcp_adapters自己的HTTP/SSE工具。回退到环境运行时。

故意不从langgraph.config.get_config()读。运行上下文在runtime上。不在传播给子runnable的RunnableConfig上。get_config().get("context")在工具调用里是None。

### 3、build_context_headers_interceptor函数

这是主函数。构建注入请求级头的工具拦截器。返回None表示没有可用的headers_from_context声明。

构建时逐个检查启用的服务器。

headers_from_context为None、未启用、无headers时跳过。

stdio传输的服务器打警告跳过。stdio没有HTTP头。池化stdio路径把重写的头转发为调用元数据。不是传输头。凭据去不了任何地方。deny错误还会对不携带密钥的运行触发。警告加跳过和user_auth一致。

task_toolsets声明的服务器打警告。持久任务的提交发生在Agent运行内。携带请求密钥。后面的状态取消轮询没有。那些调用故意跳过这个拦截器。背景部分用配置的凭据。

拦截器本身。逐个解析映射的头。密钥值为空字符串时视为缺失。空凭据必须失败关闭。不能发空头。值能传输拒绝时记录illegal。非法的值总是被拒绝。不管on_missing。键存在时回退到发现凭据会静默用共享权威运行这个租户的调用。

illegal时抛ToolException。只列配置的键名和原因。不回显值。

missing且on_missing为deny时抛ToolException。列配置的键名。键名已在配置文件里。不泄漏。

有解析出的头时用apply_header_overrides替换。带静态头拼写。

## 三、它和谁协作

interceptors把它注册为最后一个内置拦截器。请求级值赢最终header。

它依赖headers模块的三个函数。依赖runtime.secret_context的extract_request_secrets。

MCP服务器配置的headers_from_context块是它的配置来源。

## 四、重要性评级

评级是6分（满分10分）。

理由：

这个模块填补了请求级凭据的缺口。多租户网关、每次运行API key。这些场景按用户凭据不现实。请求级凭据是正确抽象。

失败关闭设计很细。空凭据必须失败关闭。传输拒绝的值总是被拒绝。不管on_missing。deny时列键名不列值。

stdio和task_toolsets的警告跳过。处理了配置和传输不匹配的边界。

它影响每次声明了headers_from_context的服务器的每次工具调用。给6分。
