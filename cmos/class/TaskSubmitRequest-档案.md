# TaskSubmitRequest-档案

## 一、这个类是干什么的

TaskSubmitRequest是mcp/tasks/models.py里的冻结数据类。

它是协议中立请求。

MCP工具包装传给driver。

models.py是MCP长驻任务的协议中立数据结构。

TaskStatus是生命周期状态枚举。

TaskSnapshot是驱动返回的规整状态响应。

TaskReference是原始Agent run结束后driver需要的稳定数据。

TaskSubmission是持久远程句柄加初始规整状态。

这个模块位于backend/packages/harness/deerflow/mcp/tasks/models.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、TaskSubmitRequest字段

user_id、thread_id、run_id、tool_call_id。

server_name、task_name、arguments。

driver_data、local_task_id、thread_incarnation。

### 2、__post_init__验证

server_name和task_name验证存储文本。

非空。不超长。

MCP_TASK_SERVER_NAME_MAX_LENGTH和MCP_TASK_NAME_MAX_LENGTH。

### 3、TaskStatus枚举

生命周期状态是SUBMITTED、WORKING、INPUT_REQUIRED、COMPLETED、FAILED、CANCELLED。

POLLABLE是前三个。

TERMINAL是后三个。

ATTENTION是INPUT_REQUIRED加TERMINAL。

### 4、TaskSnapshot

status、result、result_preview、result_truncated、result_artifact、error、input_required、poll_after_seconds。

poll_after_seconds必须是有限正数。

NaN和infinity逃过裸小于等于0检查。

但打断消费者。消费者把它变成timedelta做下次轮询。

INPUT_REQUIRED状态必须有input_required payload。

is_pollable和needs_attention属性。

### 5、TaskReference

local_task_id、user_id、thread_id、server_name、remote_task_id。

driver_data、thread_incarnation。

from_record从仓库记录构建。

混合版本仓库可能仍发出legacy形状。

rollout期间保留其显式NULL会话作用域。

### 6、TaskSubmission

remote_task_id、snapshot、driver_data。

remote_task_id必须非空。

## 三、它和谁协作

- McpTaskSubmitter用TaskSubmitRequest提交。
- OrdinaryMcpTaskDriver返回TaskSnapshot和TaskSubmission。
- McpTaskRepository持久化TaskReference。
- MCP工具包装构造请求。

## 四、重要性评级

评级是6分。

理由如下。

这些数据结构是MCP长驻任务的协议中立核心。

TaskSnapshot验证poll_after_seconds的有限性。

NaN和infinity检查。

INPUT_REQUIRED必须有payload。

TaskReference保留legacy形状兼容。

TaskSubmission的remote_task_id验证。

这些是任务协议正确性的关键。

扣掉4分。

扣分原因是它们是数据类。
