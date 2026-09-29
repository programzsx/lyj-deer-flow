# ArtifactResolutionMiddleware档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/artifact_resolution_middleware.py`

## 一、这个类是干什么的

ArtifactResolutionMiddleware在工具执行前把工具参数里的产物句柄解析成真实引用。

模型引用产物用短句柄。句柄形如`art_xxxxxxxx`。

工具执行之前。
这个中间件把参数里的句柄替换成真实引用。
真实引用是路径、URL或任务id。
引用记录在ThreadState.tool_artifacts里。

句柄可以出现的位置有三种。

裸的句柄。
反引号包起来的句柄。
嵌在更长字符串里的句柄。

未知或过期的句柄返回结构化错误。不执行工具。

## 二、类的成员

### （一）字段

- `_config`：ToolArtifactConfig配置。
- `_handle_re`：句柄匹配的正则。

### （二）方法

钩子方法是重点。

- `wrap_tool_call`和`awrap_tool_call`：工具调用边界。在执行前解析参数里的句柄。解析不了就返回结构化错误。

核心方法：

- `_resolve_request`：执行一个请求的解析。返回改写后的请求或错误消息。
- `_unknown_handles`：找出解析不了的句柄。
- `_resolve_value`：解析一个参数值。
- `_resolve_string`：解析字符串里的句柄。三种出现位置都覆盖。

## 三、它和谁协作

- 它挂在中间件链的工具调用边界上。
- 它读ThreadState.tool_artifacts。ArtifactCaptureMiddleware采集的。
- 它保护的工具是所有带参数的工具。句柄出现就替换。

## 四、重要性评级

评级：6/10。

理由：句柄解析是产物机制对模型透明的关键。没有它模型要自己拼路径。解析错误给结构化错误而不是执行失败。但它逻辑面窄。单做替换。所以给6分。