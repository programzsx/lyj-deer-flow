# McpTaskSubmitter-档案

## 一、这个类是干什么的

McpTaskSubmitter不是类。

McpTaskSubmitter是mcp/tasks/runtime.py里的Protocol。

runtime.py是Agent工具包装到Gateway任务服务的进程内桥。

McpTaskConfigurationError是配置的长驻MCP契约不能安全运行时抛出。

长驻MCP任务的运行时配置和提交边界。

这个模块位于backend/packages/harness/deerflow/mcp/tasks/runtime.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、McpTaskSubmitter Protocol

submit提交任务。

list_tasks列任务。按线程。

cancel_matching_task取消匹配任务。

### 2、McpTaskDriver Protocol

driver.py里。

submit返回TaskSubmission。

get_status返回TaskSnapshot。

cancel返回TaskSnapshot。

传输和协议adapter。协议中立任务runtime用它。

### 3、McpTaskDriverRegistry

进程内driver目录。Gateway启动时接线。

register注册。名字非空。重复抛错。

get取driver。names返回排序名字。

### 4、配置快照

_task_server_configs构建任务启用的服务器配置。

task_toolsets非空的启用服务器。

set_mcp_task_config_snapshot冻结一个Gateway进程生命周期的设置。

validate_mcp_task_config_snapshot拒绝拆分工具发现和后台调用的热变更。

改变后重启DeerFlow才能用持久任务工具。

### 5、submitter边界

set_mcp_task_submitter安装或清除Gateway拥有的提交边界。

is_mcp_task_runtime_available判断是否安装。

get_mcp_task_submitter取边界。

未初始化时抛McpTaskConfigurationError。

要求mcp_tasks.enabled为true和SQL数据库后端。

### 6、fail startup

validate_mcp_task_runtime_configuration在启动时fail。

task_toolsets配置但mcp_tasks.enabled为false时抛错。

不静默把这些工具暴露成同步调用。

SQL持久化缺失时抛错。

memory后端重启后不能恢复任务。

build_server_params失败时转成McpTaskConfigurationError。

## 三、它和谁协作

- McpTaskService实现submitter协议。
- McpTaskDriver和OrdinaryMcpTaskDriver是传输adapter。
- MCP工具包装调用get_mcp_task_submitter。
- ExtensionsConfig提供服务器配置。

## 四、重要性评级

评级是7分。

理由如下。

这个模块是长驻MCP任务的运行时边界。

配置快照防止热变更拆分工具发现和后台调用。

fail startup防止静默回退到同步调用。

submitter边界把工具包装接到Gateway服务。

driver注册表进程内接线。

这些是持久任务安全的关键。

扣掉3分。

扣分原因是它是桥和协议层。
