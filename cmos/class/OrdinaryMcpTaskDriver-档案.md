# OrdinaryMcpTaskDriver档案

## 一、这个类是干什么的

这个类是`deerflow.mcp.tasks.ordinary`模块的核心类。

这个类的作用是把配置好的普通三工具契约绑定到归一化的任务状态。

类文档写的是"Bind a configured ordinary three-tool contract to normalized task state"。意思是把配置好的普通三工具契约绑定到归一化任务状态。

背景是这样的。

DeerFlow支持长时运行MCP任务。

远端MCP服务器用三个原始工具暴露任务操作。

三个工具是提交工具、状态工具、取消工具。

管理员在`extensions_config.json`里为服务器配置`task_toolsets`。这里绑定精确的原始工具名。

`OrdinaryMcpTaskDriver`实现`McpTaskDriver`协议。这个类把三工具契约翻译成协议中立的任务操作。

模块docstring写的是"Driver for ordinary MCP submit/status/cancel tool contracts"。

这个类的使用场景是任务运行时。`McpTaskService`解析到这个驱动后，通过三个方法操作远端任务。

mcp的AGENTS.md说明这个驱动的重要行为。`ordinary.py`只读取MCP的`structuredContent`，不解析纯文本内容。远端的`running`状态映射成本地的`working`。`error_code=task_not_found`或畸形结构化输出被当成永久失败。

## 二、类的成员

### 1、字段

- `_caller`：`McpTaskToolCaller`协议对象。这个字段是工具调用能力。构造时传入。

### 2、方法

- `__init__`：输入是`McpTaskToolCaller`协议对象。这个方法保存调用能力。
- `submit`：异步方法。输入是`TaskSubmitRequest`。输出是`TaskSubmission`。流程是这样的。第一步，从`driver_data`里取出`submit_tool`名。缺失就抛`McpTaskProtocolError`。第二步，通过调用者发起MCP调用。提交调用独有地设置`request_scoped_headers=True`。源码注释解释了原因。提交在Agent运行内被同步等待，是唯一能携带运行请求级凭证的持久任务调用。状态和取消在Agent运行结束后执行。第三步，校验结构化内容。第四步，构造`TaskSubmission`。远端任务ID来自负载。初始快照状态是`SUBMITTED`。
- `get_status`：异步方法。输入是`TaskReference`。输出是`TaskSnapshot`。流程是这样的。第一步，取出`status_tool`名。第二步，通过调用者发起状态查询。参数是`task_id`。第三步，校验状态负载。第四步，校验远端返回的任务ID与持久化的远端任务ID一致。不一致抛`McpTaskProtocolError`。第五步，转换成`TaskSnapshot`。
- `cancel`：异步方法。输入是`TaskReference`。输出是`TaskSnapshot`。流程与状态查询类似。取出`cancel_tool`名。发起取消调用。校验负载。校验任务ID一致。转换成快照。
- `_require_matching_task_id`：静态方法。输入是实际ID和期望ID。两者不一致就抛`McpTaskProtocolError`。这个校验防止远端返回别的任务的状态。

### 3、设计要点

模块里有几个辅助函数配合这个类。

- `_structured_content`：检查调用结果。`isError`为真时抛出`RuntimeError`，错误信息附带第一个文本块的有限文本。没有`structuredContent`时抛`McpTaskProtocolError`。AGENTS.md说明`isError=true`的状态调用是可重试的调用失败，而永久的远端任务结果必须以`status=failed`的正常结果到达。
- `_snapshot_from_status`：把负载转换成快照。处理`task_not_found`错误码。处理`input_required`缺失的契约违规。远端状态映射到本地状态。
- `_tool_name`和`_connection_scope`：从`driver_data`里取出工具名和连接作用域。

## 三、它和谁协作

这个类和以下对象协作。

- `McpTaskDriver`：这个类实现的协议。
- `McpTaskToolCaller`：组合的调用能力。`task_tool_caller`模块的具体实现。
- `McpTaskService`：上游运行时。运行时解析并调用这个驱动。
- `TaskSubmitRequest`、`TaskSubmission`、`TaskReference`、`TaskSnapshot`：四个数据类。输入输出载体。
- `_SubmitPayload`、`_StatusPayload`、`_CancelPayload`：三个负载模型。校验远端返回。
- `McpTaskProtocolError`：契约违规异常。
- `TaskStatus`：状态枚举。远端状态映射到这里。

## 四、重要性评级

评级：8分。

理由如下。

这个类是普通三工具契约的唯一驱动实现。配置了`task_toolsets`的服务器全部靠这个类操作远端任务。没有这个类，长时任务的提交、状态、取消都无从执行。

这个类承载了协议翻译的关键逻辑。远端状态映射到本地状态。`task_not_found`映射到永久失败。`isError`和`structuredContent`的区分。这些都是系统文档明确记录的契约行为。

这个类的ID一致性校验防止了远端返回错误任务的数据。

依赖方明确。`McpTaskService`通过驱动目录解析到这个类。如果删掉这个类，普通三工具契约的全部任务都会无法驱动。

不给满分的原因是。这个类只服务普通三工具契约这一种协议。运行时调度和持久化不在这个类里。

所以这个类给8分。
