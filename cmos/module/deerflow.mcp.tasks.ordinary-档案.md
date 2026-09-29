# deerflow.mcp.tasks.ordinary

## 一、这个模块是干什么的

这个模块是普通MCP任务的驱动。

背景是这样的。

很多MCP服务器用普通的三个工具表达任务。

三个工具是submit、status、cancel。

提交任务用一个工具。

查状态用一个工具。

取消任务用一个工具。

这个驱动把这种"普通三工具契约"接到协议中立的任务运行时上。

它做的事是这样的。

把持久化的驱动配置翻译成实际工具调用。

把远程工具的返回解析成归一化的任务状态。

远程返回有契约。

不符合契约就抛McpTaskProtocolError。

返回的任务id必须和持久化的远程任务id一致。

不一致说明远程行为有问题。

这里有个关键细节。

提交是唯一带请求作用域凭据的调用。

因为提交是在代理运行内等待的。

状态和取消在代理运行结束后跑。

那时凭据已经不可用了。

## 二、模块里的主要成员

- OrdinaryMcpTaskDriver：普通三工具契约的驱动。实现McpTaskDriver协议。
- submit：调用提交工具。解析返回。要求返回里有task_id和status=running。
- get_status：调用状态工具。解析返回。要求返回的task_id和持久化的一致。
- cancel：调用取消工具。解析返回。同样校验task_id。
- McpTaskProtocolError：远程契约违规的异常。
- _SubmitPayload、_StatusPayload、_CancelPayload：远程返回的Pydantic模型。
- _structured_content：从工具结果提取结构化内容。
- _parse：解析并校验远程返回。契约违规抛协议错误。
- _tool_name、_connection_scope：从驱动数据读工具名和连接范围。
- _snapshot_from_status：把远程状态映射到协议中立的任务状态。
- ORDINARY_MCP_TASK_DRIVER：这个驱动的注册名。

## 三、它和谁协作

- 它实现mcp/tasks/driver的McpTaskDriver协议。
- 它通过McpTaskToolCaller调实际的MCP工具。
- 它被mcp/tasks/runtime和Gateway的任务服务消费。
- 它依赖mcp/tasks/models的数据结构。

## 四、重要性评级

评级是5分。

理由是它是长任务功能的主要驱动。

大多数MCP服务器走的就是普通三工具契约。

严格契约校验防住了远程行为漂移。

请求作用域凭据的区分是并发正确性细节。

但它体量中等，逻辑直白。
