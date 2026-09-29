# deerflow.mcp.user_tools-档案

## 一、这个模块是干什么的

这个模块加载调用者自己的个人MCP工具。绝不把它们发布到全局缓存。

个人MCP连接是用户私有的。一个用户的工具对另一个用户不可见。工具在每次调用时检查所有者和当前配置修订。

个人发现故意不进部署的单例缓存。stdio会话复用保持所有者、线程、修订范围。

## 二、模块里的主要成员

### 1、_guard函数

这个函数给个人MCP工具包装一个所有者和配置修订的检查。

它包装工具的原始协程。返回工具的model_copy。协程被替换成带检查的invoke。

invoke做三件事。

第一件。检查所有者。resolve_runtime_user_id不等于所有者时抛ToolException。提示这个MCP连接属于另一个用户。

第二件。用load_user_mcp_config_if_changed检查当前配置。服务器被改、禁用或删除时抛ToolException。提示开始一个新运行。

第三件。用require_personal_mcp_access检查管理员权限。特权连接需要当前管理员。

三件事都过了才调用原始协程。

snapshot缓存避免每次调用重新解析配置。文件不变时复用。

### 2、_load函数

这个函数加载个人工具。

调用get_mcp_tools。带personal_user_id。得到工具后。逐个用_guard包装。带所有者和服务器名。没有服务器元数据的工具跳过。

### 3、get_user_mcp_tools函数

这是入口。

解析所有者。读取个人配置。没有启用的服务器返回空列表加配置。有就同步包装加载。返回工具列表和配置。

## 三、它和谁协作

tools.py在发现时可以调用get_user_mcp_tools。

它依赖personal_access的require_personal_mcp_access。依赖user_config的读取函数。依赖runtime.user_context的resolve_runtime_user_id。依赖tools.mcp_metadata的get_mcp_source。依赖tools.sync的make_sync_tool_wrapper。

## 四、重要性评级

评级是4分（满分10分）。

理由：

这个模块是个人MCP工具的加载和守卫层。所有者检查、配置修订检查、管理员权限检查都在每次调用时做。

个人发现不进全局缓存。这是隔离的正确做法。个人工具不会泄漏到其他用户。

_guard的三重检查细。所有者。修订。权限。都过了才调用原始协程。

它小。61行。它只是包装层。给4分。
