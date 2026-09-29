# TaskSubmitRequest档案

## 一、这个类是干什么的

这个类是`deerflow.mcp.tasks.models`模块的数据类。

这个类的作用是承载协议中立的提交请求。请求由MCP工具包装器传给任务驱动。

类文档写的是"Protocol-neutral request passed to a driver by an MCP tool wrapper"。意思是由MCP工具包装器传给驱动的协议中立请求。

背景是这样的。

DeerFlow支持长时运行MCP任务。

Agent调用提交工具时，工具包装器拦截调用。

包装器构造一个提交请求。

请求经过提交者，最终到达驱动。

驱动用这个请求发起远端调用。

`TaskSubmitRequest`就是这条链路的请求载体。

请求是协议中立的。请求不知道驱动背后是什么协议。

模块文件没有docstring。这个类的docstring承载了设计意图。

## 二、类的成员

### 1、字段

这个类是frozen dataclass，带slots。

- `user_id`：字符串字段。这个字段记录提交者的用户ID。
- `thread_id`：字符串字段。这个字段记录提交所在的线程ID。
- `run_id`：可选字符串字段。这个字段记录Agent运行的ID。
- `tool_call_id`：可选字符串字段。这个字段记录工具调用的ID。
- `server_name`：字符串字段。这个字段记录目标MCP服务器名。
- `task_name`：字符串字段。这个字段记录任务名。
- `arguments`：字典字段。这个字段存放任务的原始参数。
- `driver_data`：字典字段，默认空字典。这个字段存放驱动私有数据。普通驱动用这个字段存绑定的工具名和连接作用域。
- `local_task_id`：可选字符串字段，默认是`None`。这个字段记录本地任务ID。
- `thread_incarnation`：可选字符串字段，默认是`None`。这个字段记录线程化身版本标识。

### 2、方法

- `__post_init__`：构造后的校验方法。这个方法校验两个字段。第一，`server_name`非空且不超过`MCP_TASK_SERVER_NAME_MAX_LENGTH`，也就是128字符。第二，`task_name`非空且不超过`MCP_TASK_NAME_MAX_LENGTH`，也就是255字符。校验用`_validate_storage_text`辅助函数。函数检查去掉空白后非空，以及长度上限。

### 3、设计要点

长度校验和SQL schema对齐。mcp的AGENTS.md说明远端任务ID和任务名限制在255字符，任务启用的服务器名限制在128字符。这些限制匹配SQL schema。

校验发生在构造时。畸形请求在进入链路之前就被挡住。

## 三、它和谁协作

这个类和以下对象协作。

- `McpTaskDriver`：协议声明了`submit`的输入类型是这个请求。
- `OrdinaryMcpTaskDriver`：驱动的`submit`方法消费这个请求。驱动从`driver_data`里读绑定的工具名和连接作用域。
- `McpTaskSubmitter`：提交者协议声明了`submit`的输入类型是这个请求。
- Agent工具包装器：包装器构造这个请求。
- `McpTaskService`：提交者实现消费这个请求。
- `TaskSubmission`：提交成功后的返回载体。请求是进，提交是出。

## 四、重要性评级

评级：6分。

理由如下。

这个类是提交链路的统一请求载体。工具包装器、提交者、驱动三个环节共用这个结构。没有这个类，每个环节自造请求形状。

构造时校验把畸形请求挡在链路外。长度限制和SQL schema对齐。服务器名超限、任务名超限、空白名都会在构造时失败。

`driver_data`字段是驱动扩展点。请求保持协议中立，驱动私有的东西放这个字段。

依赖方明确。协议、驱动、提交者、包装器都在这条链路上。如果删掉这个类，提交链路失去统一请求形状。

但是这个类本体是纯数据容器。这个类只有一个校验方法。

所以这个类给6分。
