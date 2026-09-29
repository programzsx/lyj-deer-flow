# _StatusPayload-档案

## 一、这个类是干什么的

_StatusPayload是mcp/tasks/ordinary.py里的pydantic模型。

ordinary.py的payload模型有四个。

_SubmitPayload是提交响应。

_ResultArtifact是结果artifact。

_StatusPayload是状态响应。

_CancelPayload是取消响应。

它们验证MCP服务器返回的payload结构。

extra=ignore忽略未知字段。

这个文档覆盖四个payload模型。

位于backend/packages/harness/deerflow/mcp/tasks/ordinary.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、_SubmitPayload

task_id必须非空。

status必须字面量running。

extra=ignore。

提交时远程总是返回running。

### 2、_ResultArtifact

uri和mime_type必须非空。

外置大结果的artifact。

### 3、_StatusPayload

task_id必须非空。上限MCP_TASK_REMOTE_ID_MAX_LENGTH。

status必须是running、input_required、completed、failed、cancelled之一。

result、result_artifact、error、error_code、input_required。

poll_after_seconds必须大于0。不允许inf和nan。

allow_inf_nan=False。

### 4、_CancelPayload

task_id必须非空。

status必须是cancelled、completed、failed之一。

result、result_artifact、error。

### 5、状态映射

_REMOTE_TO_LOCAL_STATUS把远程状态映射到本地TaskStatus。

running映射WORKING。

input_required映射INPUT_REQUIRED。

completed映射COMPLETED。

failed映射FAILED。

cancelled映射CANCELLED。

### 6、辅助函数

_tool_name从driver_data取工具名。缺失时抛McpTaskProtocolError。

_connection_scope取连接作用域。旧任务行在personal连接之前。是deployment-owned。

无效时抛错。

_first_error_text从调用结果提取第一个错误文本。

## 三、它和谁协作

- OrdinaryMcpTaskDriver解析这些payload。
- TaskSnapshot从payload构建。
- McpTaskProtocolError处理违反。

## 四、重要性评级

评级是5分。

理由如下。

这些payload模型是MCP任务协议的验证边界。

strict的status字面量。

poll_after_seconds的allow_inf_nan=False。

extra=ignore保持前向兼容。

远程到本地状态映射。

这些质量不错。

扣掉5分。

扣分原因是它们是小验证模型。
