# McpTaskProtocolError档案

## 一、这个类是干什么的

这个类是`deerflow.mcp.tasks.ordinary`模块的异常类。

这个类继承自`RuntimeError`。

这个类的作用是表示远端任务工具返回了确定性的契约违规。

类文档写的是"A remote task tool returned a deterministic contract violation"。意思是远端任务工具返回了确定性的契约违规。

背景是这样的。

DeerFlow支持长时运行MCP任务。

本地通过三个原始工具操作远端任务。

远端返回的数据必须符合契约。

契约包括这些要求。返回必须有`structuredContent`。结构化内容必须符合负载模型。状态是`input_required`时必须带输入负载。返回的任务ID必须和持久化的ID一致。

远端违反契约时，本地需要一种信号。

这个信号要和普通运行时错误区分开。

`McpTaskProtocolError`就是那个信号。

"确定性"这个词很关键。契约违规不是网络抖动这种临时错误。契约违规是远端实现的问题。重试也不会好。这种错误被当成永久失败处理。

模块docstring写的是"Driver for ordinary MCP submit/status/cancel tool contracts"。这个类是这些契约的违规信号。

mcp的AGENTS.md说明了这个类参与的错误区分。文档写的是`isError=true`的状态调用是可重试的调用失败，而永久的远端任务结果以`status=failed`的正常结果到达。畸形结构化输出被当成永久失败。畸形输出抛出的就是这个异常。

## 二、类的成员

这个类没有定义任何新成员。

这个类只是继承了`RuntimeError`的构造和行为。

异常类的价值在于类型区分。捕获方可以单独捕获这个类型。捕获方据此把这类错误和可重试的临时错误区分开。

抛出这个异常的场景有这些。

第一个场景。`driver_data`缺少必需的工具名。`_tool_name`函数抛出。

第二个场景。`driver_data`的连接作用域非法。`_connection_scope`函数抛出。

第三个场景。调用结果没有`structuredContent`。`_structured_content`函数抛出。

第四个场景。结构化内容不符合负载模型。`_parse`函数在pydantic校验失败时抛出。

第五个场景。状态是`input_required`但没有输入负载。`_snapshot_from_status`函数抛出。

第六个场景。返回的任务ID与持久化的ID不一致。`_require_matching_task_id`方法抛出。

## 三、它和谁协作

这个类和以下对象协作。

- `OrdinaryMcpTaskDriver`：主要的抛出方。驱动的三个方法在契约违规时抛出这个异常。
- `_parse`、`_structured_content`、`_tool_name`、`_connection_scope`、`_snapshot_from_status`：模块辅助函数。这些函数检测契约违规并抛出。
- `_SubmitPayload`、`_StatusPayload`、`_CancelPayload`：三个负载模型。校验失败时`_parse`把`ValidationError`包装成这个异常。
- `McpTaskService`：上游运行时。运行时捕获异常并区分错误类别。协议违规触发退避重试策略里的对应处理。

## 四、重要性评级

评级：6分。

理由如下。

这个类是远端契约违规的统一信号。没有这个类，畸形远端数据和临时网络错误混在一起。临时错误重试是对的。契约违规重试没有意义。两类错误不区分，退避策略就失效。

这个类保护了"永久失败"语义。系统文档明确记录畸形结构化输出被当成永久失败。这个异常就是那个判定的载体。

这个类的抛出点覆盖了全部契约校验。工具名缺失、结构化内容缺失、负载校验失败、ID不一致。

但是这个类本体极小。这个类没有成员。这个类只是类型标记。

如果删掉这个类，错误信息仍然可以抛出，但捕获方失去精确的类型区分。可重试和不可重试的边界就模糊了。

所以这个类给6分。这个类在错误分类上很重要，但本体很小。
