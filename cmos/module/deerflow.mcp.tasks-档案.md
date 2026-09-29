# deerflow.mcp.tasks包档案

## 一、这个模块是干什么的

deerflow.mcp.tasks包是MCP任务驱动器的包门面。

源文件是backend/packages/harness/deerflow/mcp/tasks/__init__.py。

它的角色是立即导入式门面。

它把任务驱动机制的全部公共API一次性导入并暴露。

它没有懒加载。

它没有docstring。

它的价值在__all__清单上。

这份清单覆盖了MCP长任务的三类词汇。

三类词汇是驱动器、状态模型、普通任务驱动器。

## 二、模块里的主要成员

它从三个模块导入成员。

driver模块提供McpTaskDriver、McpTaskDriverRegistry。

McpTaskDriver是任务驱动器契约。

McpTaskDriverRegistry是驱动器注册表。

models模块提供状态模型和状态常量。

状态常量是ATTENTION_TASK_STATUSES、POLLABLE_TASK_STATUSES、TERMINAL_TASK_STATUSES。

三种状态划分了任务的三个阶段。

需要关注、可轮询、已终结。

类型是TaskReference、TaskSnapshot、TaskStatus、TaskSubmission、TaskSubmitRequest。

TaskReference是任务引用。

TaskSnapshot是任务快照。

TaskStatus是任务状态。

TaskSubmission是任务提交结果。

TaskSubmitRequest是任务提交请求。

ordinary模块提供ORDINARY_MCP_TASK_DRIVER、McpTaskProtocolError、OrdinaryMcpTaskDriver。

OrdinaryMcpTaskDriver是普通MCP任务的驱动器。

全部在__all__里。

## 三、它和谁协作

它向内聚合driver、models、ordinary三个模块。

它向上被工具层消费。

工具提交MCP任务后轮询任务状态。

它与deerflow.persistence.mcp_tasks协作。

持久层保存任务行。

它与app.mcp_tasks协作。

应用层服务管理任务的查询。

它还与deerflow.mcp包协作。

父包提供工具获取。

这个子包提供长任务驱动。

## 四、重要性评级

评级是6分。

理由如下。

它是MCP长任务机制的正式契约入口。

三类状态常量是任务轮转的核心词汇。

驱动器注册表让不同形态的任务驱动器可插拔。

普通驱动器是内置的默认实现。

扣分点在于它没有docstring。

它不做懒加载。

导入它要连带三个模块。
