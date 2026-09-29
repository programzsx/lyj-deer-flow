# _CancelPayload档案

## 一、这个类是干什么的

这个类是`deerflow.mcp.tasks.ordinary`模块的内部辅助类。

类名以下划线开头。这个命名说明这个类是内部实现细节。外部代码不应该直接使用这个类。

这个类的作用是校验MCP取消工具返回的结构化数据。

背景是这样的。

DeerFlow支持长时运行MCP任务。

任务由远端MCP服务器执行。

本地通过三个原始工具操作任务。这三个工具是提交工具、状态工具、取消工具。

取消工具被调用后，远端会返回一个JSON结构。这个结构描述任务的最终状态。

`_CancelPayload`用pydantic模型校验这个结构。

校验不通过会抛出异常。

校验通过后，数据被转换成本地的`TaskSnapshot`对象。

这个类对应的契约是三工具契约的取消环节。模块文件头部说明了这个模块的职责。模块docstring写的是"Driver for ordinary MCP submit/status/cancel tool contracts"。意思是驱动普通的MCP提交、状态、取消工具契约。

## 二、类的成员

### 1、字段

- `task_id`：字符串字段。最小长度是1。这个字段记录远端任务的ID。最大长度是常量`MCP_TASK_REMOTE_ID_MAX_LENGTH`，也就是255字符。
- `status`：字面量类型字段。只允许三个值。这三个值是`"cancelled"`、`"completed"`、`"failed"`。取消一个已经结束的任务是合法的。所以允许出现完成和失败状态。
- `result`：任意类型字段，默认是`None`。这个字段存放任务的最终结果。取消或失败的任务也可以带结果。
- `result_artifact`：`_ResultArtifact`类型字段，默认是`None`。这个字段存放结果产物的URI和MIME类型。
- `error`：字符串字段，默认是`None`。这个字段存放错误描述文本。
- `model_config`：配置项。`extra="ignore"`表示忽略远端返回的多余字段。远端加新字段不会导致校验失败。

### 2、行为

这个类是纯数据模型。这个类没有定义业务方法。

校验由pydantic自动完成。

调用方使用`model_validate`方法校验数据。`ordinary.py`的`_parse`函数负责调用这个方法。

## 三、它和谁协作

这个类和以下对象协作。

- `_ResultArtifact`：这个类组合了这个类。`result_artifact`字段嵌套了`_ResultArtifact`模型。
- `OrdinaryMcpTaskDriver`：这个类的消费方。`cancel`方法用`_parse(_CancelPayload, ...)`校验取消工具的返回值。
- `TaskSnapshot`：校验通过后，`_snapshot_from_status`函数把`_CancelPayload`转换成`TaskSnapshot`。
- `McpTaskProtocolError`：校验失败时，`_parse`函数抛出这个异常。

## 四、重要性评级

评级：6分。

理由如下。

这个类是普通MCP任务取消流程的数据契约。没有这个类，取消工具返回的数据就没有统一校验。畸形数据可能进入本地状态。

这个类被`OrdinaryMcpTaskDriver.cancel`方法依赖。这条链路是长时任务运行时的组成部分。

但是这个类的覆盖面小。这个类只服务取消这一个环节。这个类是内部实现细节。外部代码不直接引用这个类。如果删掉这个类，取消流程的校验就要重写，但系统其他部分不受影响。

所以这个类给6分。这个类重要但属于局部组件。
