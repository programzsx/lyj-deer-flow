# OrdinaryMcpTaskDriver-档案

## 一、这个类是干什么的

OrdinaryMcpTaskDriver是mcp/tasks/ordinary.py里的类。

ordinary.py是普通三工具MCP任务契约的driver。

它把配置的普通三工具契约绑定到规整任务状态。

三工具是submit_tool、status_tool、cancel_tool。

提交提交任务。状态查状态。取消取消任务。

McpTaskProtocolError是协议违反时抛出。

这个类位于backend/packages/harness/deerflow/mcp/tasks/ordinary.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、OrdinaryMcpTaskDriver本身

构造方法接受McpTaskToolCaller。

### 2、submit方法

submit用submit_tool调用。

request_scoped_headers为True。

submit单独在Agent run里被await。

它是唯一能携带run的请求级凭证的持久任务调用。

status和cancel在那个run结束后跑。

payload解析_SubmitPayload。

返回TaskSubmission。status为SUBMITTED。

### 3、get_status方法

get_status用status_tool。

参数是task_id。

payload解析_StatusPayload。

_require_matching_task_id检查响应task_id。

必须匹配持久化的远程任务。

### 4、cancel方法

cancel用cancel_tool。

同样检查task_id匹配。

### 5、_require_matching_task_id

task_id不匹配时抛McpTaskProtocolError。

防止响应的任务和持久的任务错位。

### 6、payload模型

_SubmitPayload是提交响应。task_id。

_StatusPayload和_CancelPayload是状态和取消响应。

_task_name从driver_data取工具名。

_connection_scope是deployment或personal。

_first_error_text提取第一个错误文本。

_structured_content提取结构化内容。

### 7、McpTaskToolCaller Protocol

call_tool调用MCP工具。

带server_name、tool_name、arguments、user_id、thread_id、thread_incarnation。

### 8、错误处理

McpTaskProtocolError是协议违反。

_first_error_text给调用结果的可读错误。

## 三、它和谁协作

- McpTaskToolCaller是底层工具调用。
- McpTaskDriver是协议。
- McpTaskService管理持久任务。
- TaskSnapshot和TaskSubmission是数据结构。

## 四、重要性评级

评级是6分。

理由如下。

这个driver是普通三工具契约的适配器。

task_id匹配检查防任务错位。

request_scoped_headers只在submit。

凭证安全。

payload解析严格。

这些是MCP任务协议正确性的关键。

扣掉4分。

扣分原因是它是薄适配器。
