# _BatchState-档案

## 一、这个类是干什么的

_BatchState、_BatchRecordState、_ClaimOwner是app/mcp_tasks/service.py里的三个内部数据类。

service.py是McpTaskService。

它在Agent循环外持久化和轮询长驻MCP任务。

这三个类支撑批记录状态和claim。

这个文档覆盖三个类。

位于backend/app/mcp_tasks/service.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、_BatchState

cancellation_requested标记批量取消已请求。

slots优化。

### 2、_BatchRecordState

record是批记录字典。

ordinary_release_task是ordinary释放任务。

ordinary_release_terminal标记释放终态。

cancellation_release_task是取消释放任务。

cancellation_release_terminal标记终态。

### 3、_ClaimOwner

claim_task是claim任务。

handoff_task是handoff任务。

### 4、上下文变量

_current_batch_record是ContextVar。

mcp_task_current_batch_record。

把批记录绑定到当前任务。

### 5、常量

_MAX_PERSISTED_ERROR_CHARS是4000。持久错误截断。

_MAX_INPUT_REQUIRED_BYTES是65536。input_required负载上限。

_MAX_NOTIFICATION_ATTEMPTS是5。通知重试。

_CANCELLATION_DRAIN_TIMEOUT_SECONDS是5秒。取消排空。

### 6、辅助函数

_bound_error截断错误。

_notification_completion_time返回通知完成时间。不早于claim。

_consume_task_error消费任务错误。

_task_has_cancelled_terminal_state判断取消终态。

## 三、它和谁协作

- McpTaskService管理批记录。
- McpTaskRepository持久化。
- ContextVar绑定批记录。

## 四、重要性评级

评级是4分。

理由如下。

这三个类是MCP任务服务的内部状态。

批记录、claim owner、取消状态。

常量界定错误截断、负载上限、通知重试、取消排空。

这些支撑服务正确性。

扣掉6分。

扣分原因是它们是内部辅助类。
