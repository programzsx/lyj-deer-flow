# deerflow.mcp.tasks.models

## 一、这个模块是干什么的

这个模块定义MCP长任务的数据模型。

背景是这样的。

长MCP工作有持久化的任务记录。

任务有生命周期状态。

有提交请求。

有快照。

有引用。

这些都需要一套固定的数据结构。

这个模块就是那套结构。

它还有一个设计目标。

状态是协议中立的。

不同远程接口的状态词不一样。

但运行时和数据库只有一套词汇。

所有驱动都映射到这套词汇。

状态集合还有分组。

可轮询的状态是还在跑的。

终态是结束了的。

需要关注的状态是要通知用户的。

## 二、模块里的主要成员

- TaskStatus：协议中立的任务状态枚举。取值有SUBMITTED、WORKING、INPUT_REQUIRED、COMPLETED、FAILED、CANCELLED。
- POLLABLE_TASK_STATUSES：可轮询状态集合。包括submitted、working、input_required。
- TERMINAL_TASK_STATUSES：终态集合。包括completed、failed、cancelled。
- ATTENTION_TASK_STATUSES：需要关注的状态集合。包括input_required和全部终态。
- TaskSnapshot：一次归一化的状态响应。包含状态、结果、结果预览。
- TaskReference：任务的持久化引用。包含远程任务id、驱动数据、用户和线程身份。
- TaskSubmitRequest：提交请求。包含服务器名、参数、驱动数据。
- TaskSubmission：提交结果。包含远程任务id和初始快照。
- _validate_storage_text：校验存储文本。非空且不超长。

## 三、它和谁协作

- 它被mcp/tasks/driver引用。驱动协议的参数和返回值。
- 它被mcp/tasks/ordinary引用。普通驱动映射远程状态到这套词汇。
- 它被mcp/tasks/runtime和persistence/mcp_tasks引用。
- 它被数据库模型和迁移引用。

## 四、重要性评级

评级是5分。

理由是它是长任务运行时的共享词汇。

数据库、运行时、驱动全部依赖这套结构。

协议中立的状态设计让驱动可插拔。

状态分组支撑轮询和通知的判断。

但它只是数据定义，没有逻辑。
