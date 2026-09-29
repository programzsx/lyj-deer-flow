# _SubmitPayload档案

## 一、这个类是干什么的

这个类是`deerflow.mcp.tasks.ordinary`模块的内部辅助类。

类名以下划线开头。这个命名说明这个类是内部实现细节。外部代码不应该直接使用这个类。

这个类的作用是校验MCP提交工具返回的结构化数据。

背景是这样的。

DeerFlow支持长时运行MCP任务。

本地调用远端的提交工具来启动一个任务。

提交工具被调用后，远端返回一个JSON结构。这个结构里最关键的信息是远端任务ID。

`_SubmitPayload`用pydantic模型校验这个结构。

模块docstring写的是"Driver for ordinary MCP submit/status/cancel tool contracts"。这个类对应契约里的提交环节。

## 二、类的成员

### 1、字段

- `task_id`：字符串字段。最小长度是1。这个字段记录远端返回的任务ID。这个字段没有最大长度约束，与状态和取消负载不同。
- `status`：字面量类型字段。只允许一个值。这个值是`"running"`。提交成功意味着任务已经开始运行。
- `model_config`：配置项。`extra="ignore"`表示忽略远端返回的多余字段。

### 2、行为

这个类是纯数据模型。这个类没有定义业务方法。

`OrdinaryMcpTaskDriver.submit`方法消费这个类。校验通过后，方法从`payload.task_id`取出远端任务ID。这个ID被放进`TaskSubmission.remote_task_id`字段。

## 三、它和谁协作

这个类和以下对象协作。

- `OrdinaryMcpTaskDriver`：这个类的消费方。`submit`方法用`_parse(_SubmitPayload, ...)`校验提交工具的返回值。
- `TaskSubmission`：校验通过后，`submit`方法构造这个对象。`remote_task_id`来自`_SubmitPayload.task_id`。
- `TaskSnapshot`：`submit`方法同时构造一个状态为`SUBMITTED`的初始快照。
- `McpTaskProtocolError`：校验失败时，`_parse`函数抛出这个异常。

## 四、重要性评级

评级：5分。

理由如下。

这个类是提交链路的守门员。远端任务ID是整个长时任务机制的基础。本地后续的状态查询、取消、通知都靠这个ID。如果提交时校验不到合法的ID，后面全部流程无从谈起。

`task_id`的最小长度约束保证了一个空ID不会进入数据库。

但是这个类非常小。这个类只有两个字段。这个类的逻辑几乎全部由pydantic承担。

这个类是内部实现细节。外部代码不直接引用这个类。

所以这个类给5分。这个类处在关键链路上，但体量很小。
