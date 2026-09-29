# McpTaskConfigurationError档案

## 一、这个类是干什么的

这个类是`deerflow.mcp.tasks.runtime`模块的异常类。

这个类继承自`RuntimeError`。

这个类的作用是表示配置的长时运行MCP契约无法安全运行。

类文档写的是"The configured long-running MCP contract cannot run safely"。意思是配置的长时运行MCP契约无法安全运行。

背景是这样的。

DeerFlow支持长时运行MCP任务。

长时任务运行时需要满足两个条件。

第一个条件是`mcp_tasks.enabled`必须为`true`。

第二个条件是持久化后端必须是SQL数据库。可以是SQLite或PostgreSQL。内存后端无法在重启后恢复任务。

配置了`task_toolsets`但不满足这两个条件时，启动必须失败。

类文档的失败设计在`validate_mcp_task_runtime_configuration`函数里体现。这个函数的docstring写的是"Fail startup when task toolsets would silently fall back to sync calls"。意思是当任务工具集会静默退化为同步调用时，启动必须失败。

这个异常类在三种场景被抛出。

第一种场景。`McpTaskSubmitter`未初始化时，`get_mcp_task_submitter`抛出这个异常。错误信息说明运行时未初始化，要求通过Gateway运行，且开启`mcp_tasks.enabled`和SQL后端。

第二种场景。任务工具集已配置但运行时被禁用时，启动校验抛出这个异常。错误信息说明不会静默暴露这些工具为同步调用。

第三种场景。持久化后端是内存时，启动校验抛出这个异常。错误信息说明内存后端无法在重启后恢复任务。

还有一种场景。热修改被拒绝时抛出这个异常。`validate_mcp_task_config_snapshot`发现启动后的配置变化会分裂工具发现和后台调用。这个异常说明需要重启DeerFlow。

## 二、类的成员

这个类没有定义任何新成员。

这个类只是继承了`RuntimeError`的构造和行为。

异常类的价值在于类型区分。捕获方可以单独捕获这个类型，与其他`RuntimeError`区分开。

调用方捕获这个异常的场景。mcp的AGENTS.md说明了一个例子。工具发现失败时，`McpTaskConfigurationError`会被记录一次，不会触发第二次发现。

## 三、它和谁协作

这个类和以下对象协作。

- `runtime`模块的函数：这个模块的多个函数抛出这个异常。抛出方包括`get_mcp_task_submitter`、`validate_mcp_task_runtime_configuration`、`validate_mcp_task_config_snapshot`。
- Gateway启动流程：启动校验调用`validate_mcp_task_runtime_configuration`。校验失败，启动中断。
- 配置加载方：`initialize_mcp_tools`等路径可能遇到这个异常。

## 四、重要性评级

评级：6分。

理由如下。

这个类是长时任务配置错误的统一信号。没有这个类，配置错误可能被静默吞掉。任务工具集可能静默退化为同步调用。这是系统文档明确禁止的行为。

这个类保护了"fail fast"原则。配置不满足就拒绝启动。拒绝比静默退化安全。

这个类的热修改检查也依赖这个类。运行时配置和工具发现的分裂被这个异常挡住。

但是这个类本体极小。这个类没有成员。这个类只是类型标记。

如果删掉这个类，错误信息仍然可以抛出，但捕获方失去精确的类型区分。

所以这个类给6分。这个类在安全设计上很重要，但本体很小。
