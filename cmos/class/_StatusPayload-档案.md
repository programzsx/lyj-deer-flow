# _StatusPayload档案

## 一、这个类是干什么的

这个类是`deerflow.mcp.tasks.ordinary`模块的内部辅助类。

类名以下划线开头。这个命名说明这个类是内部实现细节。外部代码不应该直接使用这个类。

这个类的作用是校验MCP状态工具返回的结构化数据。

背景是这样的。

DeerFlow支持长时运行MCP任务。

本地需要反复查询远端任务的状态。

状态工具被调用后，远端返回一个JSON结构。这个结构描述任务的当前状态。

`_StatusPayload`用pydantic模型校验这个结构。

这个类是五个负载模型里字段最多的一个。状态、结果、产物、错误、输入请求、轮询间隔都在这个类里。

模块docstring写的是"Driver for ordinary MCP submit/status/cancel tool contracts"。这个类对应契约里的状态查询环节。

## 二、类的成员

### 1、字段

- `task_id`：字符串字段。最小长度是1。最大长度是常量`MCP_TASK_REMOTE_ID_MAX_LENGTH`，也就是255字符。这个字段记录远端任务的ID。
- `status`：字面量类型字段。允许五个值。这五个值是`"running"`、`"input_required"`、`"completed"`、`"failed"`、`"cancelled"`。这五个值覆盖了远端任务的全部生命周期。
- `result`：任意类型字段，默认是`None`。这个字段存放任务的执行结果。
- `result_artifact`：`_ResultArtifact`类型字段，默认是`None`。这个字段存放结果产物的URI和MIME类型。
- `error`：字符串字段，默认是`None`。这个字段存放错误描述。
- `error_code`：字符串字段，默认是`None`。这个字段存放错误码。特殊值`"task_not_found"`有专门的处理逻辑。
- `input_required`：字典字段，默认是`None`。这个字段存放"需要用户输入"场景下的负载。
- `poll_after_seconds`：浮点数字段，默认是`None`。这个字段是远端建议的下一次轮询间隔。约束是必须大于0，且不允许出现NaN和无穷大。
- `model_config`：配置项。`extra="ignore"`表示忽略远端返回的多余字段。

### 2、行为

这个类是纯数据模型。这个类没有定义业务方法。

`ordinary.py`的`_snapshot_from_status`函数消费这个类。消费逻辑有几个要点。

第一点。`error_code`等于`"task_not_found"`时，函数返回一个失败状态的`TaskSnapshot`。远端任务不存在被当成永久失败。

第二点。`status`等于`"input_required"`但`input_required`字段是`None`时，函数抛出`McpTaskProtocolError`。远端说需要输入却没给输入负载，这属于契约违规。

第三点。远端的`"running"`状态被映射成本地的`TaskStatus.WORKING`。

## 三、它和谁协作

这个类和以下对象协作。

- `_ResultArtifact`：这个类组合了这个类。`result_artifact`字段嵌套了`_ResultArtifact`模型。
- `OrdinaryMcpTaskDriver`：这个类的消费方。`get_status`方法用`_parse(_StatusPayload, ...)`校验状态工具的返回值。
- `TaskSnapshot`：校验通过后，`_snapshot_from_status`函数把这个类转换成`TaskSnapshot`。
- `TaskStatus`：`_REMOTE_TO_LOCAL_STATUS`映射表把这个类的状态值翻译成本地状态枚举。
- `McpTaskProtocolError`：校验失败或契约违规时抛出这个异常。

## 四、重要性评级

评级：7分。

理由如下。

这个类是普通MCP任务状态轮询的核心契约。状态轮询是长时任务运行时最频繁的动作。每一次轮询都要经过这个类校验。

这个类承载的约束最多。轮询间隔必须有限且为正。输入请求必须有负载。这些约束保证了下游消费安全。`TaskSnapshot`对`poll_after_seconds`的校验依赖这个类先挡掉畸形数据。

这个类的依赖方明确。`OrdinaryMcpTaskDriver.get_status`和`_snapshot_from_status`都依赖这个类。如果删掉这个类，状态轮询就失去数据校验，畸形远端数据会污染本地任务状态。

这个类是内部实现细节，不直接暴露给外部。所以不给满分。

所以这个类给7分。
