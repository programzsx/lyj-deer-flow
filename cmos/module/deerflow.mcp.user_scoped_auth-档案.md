# deerflow.mcp.user_scoped_auth-档案

## 一、这个模块是干什么的

这个模块为共享MCP服务器提供按用户凭据注入。

一个配置的HTTP或SSE MCP服务器可以服务多个DeerFlow用户。每个用户对远程服务用自己认证的凭据。一个服务器通过声明user_auth块来启用。块把DeerFlow用户id映射到凭据header值。支持$ENV_VAR引用。

每次工具调用拦截器解析认证用户。重写配置的header。

服务器的静态headers只用于启动工具发现。user_auth启用后不认证用户的工具调用。除非显式设置on_missing为passthrough。

失败关闭。未映射的用户（包括匿名DEFAULT_USER_ID回退）。或映射凭据的$ENV_VAR引用解析成空字符串。得到可操作的ToolException。而不是另一个用户的凭据或发现凭据。

## 二、模块里的主要成员

### 1、_current_runtime函数

尽力访问当前工具调用的LangGraph运行时。

get_runtime()在运行时上下文之外抛异常。失败只是降低准确性。不崩溃调用。

### 2、build_user_scoped_auth_interceptor函数

这是主函数。构建注入按用户凭据的工具拦截器。没有启用user_auth块的服务器时返回None。调用方跳过注册。

构建时逐个检查启用的服务器。

user_auth为None或未启用时跳过。

stdio传输的服务器打警告跳过。stdio没有HTTP头。池化stdio路径把重写的头转发为调用元数据。不是传输头。凭据去不了任何地方。deny错误还会对未映射用户触发。警告加跳过和transport配置不匹配的约定一致。

拦截器本身。user_id从runtime解析。优先用请求附着的runtime。回退到环境运行时。再回退到resolve_runtime_user_id自己的链。

凭据从user_auth.users里取。取不到或为空时。on_missing为passthrough就放行。否则抛ToolException。解析的id包含在错误里。方便操作员复制确切的users键。id因部署路径不同。LangGraph auth的safe-slug。嵌入式Gateway的原始UUID。是调用者自己的id。不泄漏跨用户。

凭据能传输拒绝时（换行、周围空白、非ASCII）。总是被拒绝。不管on_missing。用户已映射。回退到发现凭据会静默用共享权威运行调用。

有凭据时用apply_header_overrides替换。带静态头拼写。

## 三、它和谁协作

interceptors把它注册在OAuth之后。所以它比OAuth的按服务器凭据更具体。赢最终header。

它依赖headers模块的三个函数。依赖runtime.user_context的resolve_runtime_user_id。

MCP服务器配置的user_auth块是它的配置来源。

## 四、重要性评级

评级是6分（满分10分）。

理由：

这个模块是一个共享MCP服务器服务多个用户的认证基础。没有它。一个服务器一个凭据。多用户场景要么共享凭据要么一个用户一个服务器条目。

失败关闭设计细。未映射用户拒绝。空凭据拒绝。传输拒绝的值总是拒绝。不管on_missing。拒绝消息带解析的id。方便操作员修配置。id是调用者自己的。不泄漏跨用户。

stdio的警告跳过处理了配置和传输不匹配。

它影响每个启用user_auth的服务器的每次工具调用。给6分。
