# deerflow.mcp.tasks-档案

## 一、这个包是干什么的

这个包是DeerFlow的"MCP长任务契约"包。

包名是`deerflow.mcp.tasks`。源码在`backend/packages/harness/deerflow/mcp/tasks/`。它是`deerflow.mcp`的子包。

大白话讲。有些MCP工具调用不是几秒钟就完事的。比如让远端跑一个分析任务。提交之后要跑几分钟。这种长任务不能把agent循环占住等结果。这个包定义长任务的"契约"。

契约的意思是协议无关的抽象。具体远端怎么报状态、怎么取消，各协议有自己的说法。这个包把状态规范化成统一的几个值。谁想接入长任务运行时，谁就实现这个包定义的驱动接口。

这个包本身只定义契约和规范化模型。它不碰数据库。持久层在`persistence/mcp_tasks/`。执行服务在`app/mcp_tasks/McpTaskService`。它自己也不改变普通MCP工具的行为。

## 二、包里的主要成员

### 1、__init__.py

它把三个模块的公共成员汇总导出。包括`McpTaskDriver`、`McpTaskDriverRegistry`、`TaskSnapshot`、`TaskStatus`、`TaskSubmission`、`TaskSubmitRequest`、`TaskReference`、`ORDINARY_MCP_TASK_DRIVER`、`OrdinaryMcpTaskDriver`、`McpTaskProtocolError`和三组状态集合。

### 2、models.py（规范化模型）

这个模块定义协议无关的生命周期模型。

- `TaskStatus`。StrEnum。六个生命周期状态。`submitted`、`working`、`input_required`、`completed`、`failed`、`cancelled`。
- 三组状态集合。`POLLABLE_TASK_STATUSES`是可轮询的三个状态。`TERMINAL_TASK_STATUSES`是终态三个。`ATTENTION_TASK_STATUSES`是需要注意的，包括`input_required`加全部终态。
- `TaskSnapshot`。驱动返回的一条规范化状态响应。带`result`、`result_preview`、`result_artifact`、`error`、`input_required`、`poll_after_seconds`。

`TaskSnapshot`有个关键校验。驱动给的`poll_after_seconds`必须是有限正数。NaN和无穷能活着通过裸的`<= 0`检查。但消费方要把这个间隔变成`timedelta`。坏值会让下一次轮询报废。所以在快照边界统一校验，让所有驱动都遵守同一个不变量。另外`input_required`状态必须带`input_required`载荷。

- `TaskReference`。稳定数据。原始agent运行结束后驱动还需要它。包含`local_task_id`、`user_id`、`thread_id`、`server_name`、`remote_task_id`、`driver_data`、`thread_incarnation`。`from_record()`兼容旧版仓库形状。
- `TaskSubmitRequest`。协议无关的提交请求。MCP工具包装器把它交给驱动。带长度校验。服务器名最多128字符。远端任务ID最多255字符，和SQL schema对齐。

### 3、driver.py（驱动契约）

- `McpTaskDriver`。Protocol。三个方法。`submit(request)`返回`TaskSubmission`。`get_status(task)`返回`TaskSnapshot`。`cancel(task)`返回`TaskSnapshot`。
- `McpTaskDriverRegistry`。进程本地的驱动目录。Gateway启动时装配。驱动名不能为空。不能重复注册。`get()`按名字取驱动。`names()`返回排好序的名字。

运行时是启动时配置的。默认禁用，直到有具体驱动注册。

### 4、ordinary.py（普通工具驱动）

这个模块实现第一个具体驱动。名字是`ordinary-tools`。面向普通MCP的submit/status/cancel工具契约。

工作方式。`extensions_config.json`里的`mcpServers.<server>.task_toolsets`绑定精确的原始提交、状态、取消工具名。一个原始工具在一个服务器的分组里只能占一个角色。驱动只读MCP的`structuredContent`。远端的`running`映射成本地的`working`。`error_code=task_not_found`或畸形结构化输出算永久失败。

Payload校验用Pydantic模型。`_SubmitPayload`、`_StatusPayload`、`_CancelPayload`。状态值是字面量枚举。`poll_after_seconds`要求大于0且不允许inf和nan。

错误分两类。状态调用`isError=true`是可重试的调用失败。第一个文本块保留为有界的诊断信息。永久性的远端任务结果必须走正常结果加结构化`status=failed`。

`McpTaskProtocolError`。远端任务工具返回确定性契约违例时抛出。

- `McpTaskToolCaller`。Protocol。驱动借它发起精确名称的MCP调用。参数包括服务器名、工具名、参数、用户、线程、线程化身、是否请求级头、连接归属（deployment或personal）。

### 5、runtime.py（进程内桥）

这个模块是agent工具包装器到Gateway任务服务的进程内桥。

- `McpTaskSubmitter`。Protocol。Gateway任务服务实现的提交边界。三个方法。`submit()`、`list_tasks()`、`cancel_matching_task()`。
- `McpTaskConfigurationError`。配置的长任务契约无法安全运行时抛出。
- `set_mcp_task_submitter()`。安装或清除Gateway拥有的提交边界。这是全局单例。
- `get_mcp_task_submitter()`。未安装时抛配置错误。提示要经Gateway运行且`mcp_tasks.enabled=true`加SQL数据库。
- `is_mcp_task_runtime_available()`。返回运行时是否已安装。
- `set_mcp_task_config_snapshot()`。把启用了任务工具集的服务器配置冻结为本进程生命周期。
- `validate_mcp_task_config_snapshot()`。拒绝会割裂工具发现和后台调用的热变更。配置在启动后变了就抛错，要求重启。
- `validate_mcp_task_runtime_configuration()`。启动时守卫。配了任务工具集但运行时禁用就报错。持久层是memory就报错。不会让这些工具静默退化成同步调用。

## 三、它和谁协作

### 1、上游（谁调用它）

实际查证全仓库有23个文件导入`deerflow.mcp.tasks`。去掉包自身和测试，生产代码里的调用方如下。

- `app.mcp_tasks.service`。`McpTaskService`。持久任务服务。它实现`McpTaskSubmitter`，消费驱动注册表和快照模型。
- `app.gateway.app`。Gateway启动时装配任务运行时。注册提交者、冻结配置快照。
- `deerflow.mcp.tools`。工具装配。`_make_background_submit_tool()`和`_configure_task_tools_for_server()`消费这个子包。提交工具的包装器在持久化后只返回本地任务ID。
- `persistence/mcp_tasks/`。持久层。拥有持久远端句柄映射、轮询调度、通知状态、租约。

### 2、下游（它依赖谁）

- `deerflow.mcp.config_normalization`。配置规范化。
- `deerflow.config.extensions_config`。读配置。
- `deerflow.constants`。长度限制常量。
- pydantic。payload校验。
- 数据库。不直接依赖，但它的存在以SQL持久层为前提。

### 3、测试

测试覆盖厚。`test_mcp_task_models.py`、`test_mcp_task_ordinary_driver.py`、`test_mcp_task_ordinary_e2e.py`、`test_mcp_task_runtime_config.py`、`test_mcp_task_repository.py`、`test_mcp_task_service.py`、`test_mcp_task_tool_caller.py`、`test_mcp_task_tool_wrapping.py`、`test_mcp_task_postgres.py`、`test_migration_0026_mcp_task_lease_tokens.py`等。

## 四、重要性评级

评级是6分。

理由如下。

这个包是MCP长任务特性的契约核心。但它默认禁用。`mcp_tasks`未启用时它完全不参与运行。没配`task_toolsets`的部署里它也不参与。

它被引用的地方中等。实际查证全仓库有23个文件导入它。生产代码里的调用方是Gateway装配、任务服务、工具包装三处。测试有十几个文件。

它处在长任务特性的必经路径上。一旦配了长任务工具集，所有提交、状态、取消都必须走这个契约。

删除它会怎样。MCP长任务特性整个失效。Gateway启动时如果检测到配置了任务工具集会直接报错拒启。没配长任务的部署不受影响。普通MCP工具照常工作。

为什么是6分。它默认禁用，不在主路径。但它是长任务契约的唯一规范点。状态规范、payload校验、运行时可用性守卫都在这里。没有替代品。它服务的"长耗时MCP任务"是生产场景的真实需求。
