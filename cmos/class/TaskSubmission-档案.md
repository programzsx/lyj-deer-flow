# TaskSubmission档案

## 一、这个类是干什么的

这个类是`deerflow.mcp.tasks.models`模块的数据类。

这个类的作用是承载持久的远端任务句柄和初始归一化状态。

类文档写的是"A durable remote handle plus its initial normalized state"。意思是一个持久的远端句柄加上初始归一化状态。

背景是这样的。

DeerFlow支持长时运行MCP任务。

驱动调用远端提交工具成功后，远端返回一个任务ID。

驱动要把这个ID和初始状态打包返回。

`TaskSubmission`就是那个返回载体。

提交者拿到提交结果后，把远端句柄持久化到数据库。

后续的状态查询、取消、通知全部靠这个句柄。

模块文件没有docstring。这个类的docstring承载了设计意图。

## 二、类的成员

### 1、字段

这个类是frozen dataclass，带slots。

- `remote_task_id`：字符串字段。这个字段记录远端任务ID。这是整个长时任务机制的核心标识。后续全部操作都靠这个ID。
- `snapshot`：`TaskSnapshot`类型字段。这个字段存放初始归一化状态。普通驱动构造的初始快照状态是`SUBMITTED`。
- `driver_data`：字典字段，默认空字典。这个字段存放驱动私有数据。普通驱动把请求的`driver_data`复制进来。这份数据随句柄一起持久化。

### 2、方法

- `__post_init__`：构造后的校验方法。这个方法校验`remote_task_id`。去掉空白后为空就抛出`ValueError`。错误信息说明远端任务ID不能为空。

### 3、设计要点

远端任务ID的空值校验保证了持久化层不会存进空句柄。空句柄的任务后续无法查询和取消。

`driver_data`随句柄持久化。这一点很关键。Agent回合结束后，驱动要用同样的`driver_data`操作远端。工具名和连接作用域都在这里。

## 三、它和谁协作

这个类和以下对象协作。

- `McpTaskDriver`：协议声明了`submit`的返回类型是这个类。
- `OrdinaryMcpTaskDriver`：驱动的`submit`方法构造这个类。`remote_task_id`来自`_SubmitPayload`。快照状态是`SUBMITTED`。
- `McpTaskSubmitter`：提交者协议声明了`submit`返回字典。提交者内部消费驱动返回的这个类，把句柄持久化。
- `TaskSnapshot`：这个类组合了快照类型。`snapshot`字段就是这个类型。
- `TaskSubmitRequest`：请求是提交的输入。这个类是提交的输出。
- `persistence/mcp_tasks/`：持久化层把远端句柄写进数据库。

## 四、重要性评级

评级：6分。

理由如下。

这个类是提交链路的终点和后续操作的起点。远端句柄被这个类从驱动带回，然后持久化。状态查询、取消、通知全部以这个句柄为基础。没有这个类，提交结果就没有统一载体。

`driver_data`随句柄持久化的设计保证了Agent回合结束后驱动还能拿到同样的配置。

空ID校验保证持久化层不会存进空句柄。

依赖方明确。协议、驱动、提交者、持久化层都在这条链路上。如果删掉这个类，提交结果失去统一载体，远端句柄的传递就是松散的字典。

但是这个类本体是纯数据容器。这个类只有一个校验。复杂逻辑在使用方那里。

所以这个类给6分。
