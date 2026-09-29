# deerflow.config.mcp_tasks_config-档案

## 一、这个模块是干什么的

这个模块管理MCP任务轮询器的配置。

有些MCP任务是长时间运行的。

提交后需要轮询状态。

这个轮询器在后台持续轮询MCP任务的进度。

配置写在`config.yaml`的`mcp_tasks:`下。

## 二、模块里的主要成员

### 1、McpTasksConfig类

`enabled`是开关，默认关闭。

`poll_interval_seconds`是轮询间隔，默认5秒。

`lease_seconds`是租约时长，默认120秒。

`max_concurrent_polls`是最大并发轮询数，默认8。

`max_poll_backoff_seconds`是轮询的最大退避，默认300秒。

`input_required_poll_interval_seconds`是等待输入任务的轮询间隔，默认60秒。

`tracking_degraded_after_errors`是连续错误多少次后标记降级，默认3次。

`max_result_bytes`是结果的最大字节数，默认64KB。

`result_preview_max_chars`是结果预览的最大字符数，默认2000。

所有数值字段都有上下限约束。

## 三、它和谁协作

`app_config.py`的`mcp_tasks`字段是这份配置。

这个字段是启动专用的。

MCP任务服务在网关生命周期启动时构造并启动。

`extensions_config.py`的`task_toolsets`声明哪些工具组交给这个运行时管理。

## 四、重要性评级

评级：5分。

理由：MCP任务运行时是长时间运行工具的支撑机制。配置面是纯参数加边界。默认关闭，属于可选的运行时。
