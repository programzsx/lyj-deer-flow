# TaskStatus档案

## 一、这个类是干什么的

这个类是`deerflow.mcp.tasks.models`模块的枚举类。

这个类继承自`StrEnum`。

这个类的作用是定义长时运行MCP任务的协议中立生命周期状态。

类文档写的是"Protocol-neutral lifecycle states for long-running MCP work"。意思是长时运行MCP工作的协议中立生命周期状态。

背景是这样的。

DeerFlow支持长时运行MCP任务。

任务有很多个环节。远端驱动、本地数据库、API响应、通知投递。

每个环节都要描述任务处于什么阶段。

如果没有统一的状态词表，每个环节自造一套说法。环节之间就要做翻译。翻译是错误的来源。

`TaskStatus`就是那份统一词表。

模块文件没有docstring。这个类的docstring承载了设计意图。

mcp的AGENTS.md说明了这个类的地位。文档写的是`mcp/tasks/`定义了协议中立的`McpTaskDriver`契约和归一化的`TaskSnapshot`状态。状态词表就是这个枚举。

## 二、类的成员

### 1、枚举值

这个类定义六个状态。

- `SUBMITTED`：值是`"submitted"`。这个状态表示任务已提交。远端句柄已拿到并持久化。远端还没有确认开始运行。
- `WORKING`：值是`"working"`。这个状态表示任务正在运行。远端的`running`状态映射到这里。
- `INPUT_REQUIRED`：值是`"input_required"`。这个状态表示任务需要用户输入。远端暂停等待输入。
- `COMPLETED`：值是`"completed"`。这个状态表示任务成功完成。
- `FAILED`：值是`"failed"`。这个状态表示任务失败。
- `CANCELLED`：值是`"cancelled"`。这个状态表示任务被取消。

### 2、模块级状态集合

模块还定义三个状态集合。这些集合按用途分组。

- `POLLABLE_TASK_STATUSES`：可轮询状态集合。包含`SUBMITTED`、`WORKING`、`INPUT_REQUIRED`。这些状态的任务需要继续轮询。
- `TERMINAL_TASK_STATUSES`：终态集合。包含`COMPLETED`、`FAILED`、`CANCELLED`。这些状态的任务停止轮询。
- `ATTENTION_TASK_STATUSES`：需要注意状态集合。包含`INPUT_REQUIRED`和全部终态。这些状态需要投递通知给Agent或用户。

### 3、设计要点

`StrEnum`让枚举值可以直接和字符串比较。数据库里的状态字符串可以直接映射成枚举。

六个状态是协议中立的。远端的`running`被`ordinary.py`翻译成`WORKING`。翻译只发生在驱动边界。运行时内部只看本地状态。

## 三、它和谁协作

这个类和以下对象协作。

- `TaskSnapshot`：快照的`status`字段就是这个枚举。
- `OrdinaryMcpTaskDriver`：驱动通过`_REMOTE_TO_LOCAL_STATUS`映射表把远端状态翻译成这个枚举。
- `McpTaskService`：任务运行时用状态集合决定轮询、通知、停止。
- 三个状态集合：可轮询、终态、需要注意。三个集合是这个枚举值的分组。
- 持久化层：`persistence/mcp_tasks/`在数据库里存储状态字符串。

## 四、重要性评级

评级：8分。

理由如下。

这个类是长时任务体系的统一状态词表。运行时、驱动、数据库、API、通知全部环节共用这份词表。没有这份词表，每个环节自造状态说法，翻译错误会污染整个任务生命周期。

三个状态集合是运行时调度的依据。哪些任务继续轮询、哪些停止、哪些投递通知，全部靠这三个集合判断。

这个类的使用面很广。`TaskSnapshot`、`OrdinaryMcpTaskDriver`、`McpTaskService`、持久化层都依赖这个枚举。如果删掉这个类，整个长时任务体系失去共同语言。

不给满分的原因是。这个类本体很小。这个类只有六个枚举值。复杂度都在使用方那里。

所以这个类给8分。
