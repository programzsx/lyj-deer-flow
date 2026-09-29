# deerflow.mcp.interceptors-档案

## 一、这个模块是干什么的

这个模块提供MCP工具调用拦截器的共享构建。

拦截器是一个异步函数。它包装MCP工具调用。可以在调用前后做处理。最常见的是注入HTTP头。

DeerFlow有三类内置拦截器。OAuth拦截器。按用户认证拦截器。上下文头拦截器。还支持自定义拦截器。通过mcpInterceptors配置加载。

这个模块负责按正确顺序构建它们。还负责把拦截器按洋葱式组合起来。

## 二、模块里的主要成员

### 1、build_mcp_tool_interceptors函数

这个函数构建拦截器列表。顺序是固定的。

第一。OAuth拦截器。

第二。按用户认证拦截器。注释解释了顺序的原因。拦截器包装是最外层优先。后注册的更靠近传输。赢最终的header值。一个服务器同时声明OAuth和user_auth时。按用户凭据赢。这是按用户凭据比按服务器凭据更具体的语义。

第三。上下文头拦截器。同样是后注册赢。调用方为这一次请求选的凭据比配置的按用户或按服务器凭据更具体。所以必须赢最终header值。

第四。自定义拦截器。从mcpInterceptors配置加载。原始值不是字符串或列表时打警告跳过。每个路径用resolver解析成builder。builder调用后必须是可调用的。不可调用的打警告。加载失败的打警告。一个坏的自定义拦截器不影响其他拦截器。

返回拦截器列表。

### 2、compose_tool_interceptors函数

这个函数把拦截器洋葱式组合在base_handler周围。第一个在最外层。

后注册的拦截器更靠近传输。所以它的header写入赢过更早的。user_scoped_auth依赖这个属性覆盖OAuth注入的凭据。

这是单一的包装约定。会话池工具路径也通过这里组合。钉住覆盖属性的测试就是在测生产组合。

## 三、它和谁协作

tools.py调用build_mcp_tool_interceptors。构建工具加载和调用时的拦截器。

task_tool_caller也调用build_mcp_tool_interceptors。构建持久任务调用的拦截器。

oauth、user_scoped_auth、context_headers三个模块提供内置拦截器构建器。

reflection的resolve_variable解析自定义拦截器路径。

## 四、重要性评级

评级是5分（满分10分）。

理由：

这个模块是拦截器的组装层。顺序语义很关键。后注册的拦截器更靠近传输。凭据覆盖的优先级靠这个顺序保证。

自定义拦截器的失败隔离。一个坏的跳过。其他继续。

compose_tool_interceptors是单一包装约定。测试测的是生产组合。

它逻辑量小。94行。主要是组装。给5分。
