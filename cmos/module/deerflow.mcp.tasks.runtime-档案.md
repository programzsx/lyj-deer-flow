# deerflow.mcp.tasks.runtime

## 一、这个模块是干什么的

这个模块是MCP长任务的运行时桥。

背景是这样的。

代理运行中会提交长MCP工作。

长工作不能塞进代理循环。

塞进去会阻塞代理。

所以要有一个独立桥。

桥把代理的工具包装接到Gateway的任务服务。

这个桥是进程内的。

它还管配置快照。

任务运行时依赖MCP服务器配置里配了任务工具集的服务器。

配置快照在Gateway启动或配置重载时刷新。

它还管配置校验。

配置的长任务契约跑不安全时报错。

它还做可用性判断。

提交器没设置时任务运行时不可用。

## 二、模块里的主要成员

- McpTaskSubmitter：提交器协议。定义submit、list_tasks、cancel_matching_task。
- McpTaskConfigurationError：配置无法安全运行时抛出的异常。
- set_mcp_task_submitter(submitter)：设置进程级提交器。Gateway启动时装配。
- get_mcp_task_submitter()：取提交器。没设置时报错。
- is_mcp_task_runtime_available()：判断任务运行时是否可用。
- set_mcp_task_config_snapshot(extensions_config)：设置配置快照。
- validate_mcp_task_config_snapshot(extensions_config)：校验配置快照。
- validate_mcp_task_runtime_configuration(...)：校验任务运行时配置。契约不安全时抛配置错误。
- configured_task_toolset_count(extensions_config)：数配了任务工具集的服务器数量。
- _task_server_configs：从扩展配置里提取配了任务工具集的服务器，做归一化。
- set_mcp_task_submitter和配置快照一起构成进程内的桥状态。

## 三、它和谁协作

- 它依赖mcp/tasks/models的数据结构。
- 它依赖mcp/config_normalization做配置归一化。
- 它被mcp/tools.py消费。代理的任务工具通过它提交和查询。
- 它被Gateway启动装配。
- 它和persistence/mcp_tasks的持久化层协作。

## 四、重要性评级

评级是5分。

理由是它是长任务功能的进程内桥。

代理工具和Gateway任务服务之间的连接靠它。

配置快照和校验防止不安全的契约运行。

但它主要是桥接和状态管理。

业务逻辑在任务服务和驱动里。
