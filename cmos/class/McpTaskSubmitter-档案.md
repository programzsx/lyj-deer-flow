# McpTaskSubmitter档案

## 一、这个类是干什么的

这个类是`deerflow.mcp.tasks.runtime`模块的协议类。

这个类的作用是声明Gateway拥有的持久任务提交边界。

这个类是Protocol协议类。这个类只定义方法签名，不提供实现。

背景是这样的。

DeerFlow支持长时运行MCP任务。

Agent工具包装器负责提交持久任务。

包装器不直接写数据库。包装器调用Gateway拥有的提交者。

提交者协议就是那个边界约定。

模块docstring写的是"Process-local bridge from Agent tool wrappers to the Gateway task service"。意思是进程本地的桥，从Agent工具包装器连接到Gateway任务服务。这个类是这个桥的协议面。

mcp的AGENTS.md说明了运行时可用性边界。文档写的是"the installed process-local submitter is the source of truth for durable task-management tool exposure"。意思是安装的进程本地提交者是持久任务管理工具暴露的事实来源。`is_mcp_task_runtime_available`检查提交者是否已安装。已安装才暴露管理工具。

Gateway启动时通过`set_mcp_task_submitter`安装真正的实现。实现是`McpTaskService`。

## 二、类的成员

这个类声明三个方法。

- `submit`：异步方法。关键字参数有`driver_name`、`request`、`now`。`request`是`TaskSubmitRequest`。`now`是可选的时间参数。输出是字典。这个方法提交一个持久任务。调用方传入驱动名和协议中立的请求。返回字典携带本地任务ID等信息。
- `list_tasks`：异步方法。关键字参数有`thread_id`、`user_id`、`thread_incarnation`、`limit`、`active_only`。输出是字典列表。这个方法列出线程的任务。`limit`默认50。`active_only`默认`False`，为`True`时只列活跃任务。
- `cancel_matching_task`：异步方法。关键字参数有`thread_id`、`user_id`、`thread_incarnation`、`task`。输出是字典。这个方法取消匹配的任务。`task`参数可以是任务名或本地任务ID。

三个方法的输入都带作用域三元组。三元组是线程ID、用户ID、线程化身。这保证查询和取消只在正确的范围内匹配。

## 三、它和谁协作

这个类和以下对象协作。

- `McpTaskService`：这个协议的真实实现。Gateway启动时安装。
- `set_mcp_task_submitter`：模块级函数。这个函数安装或清除提交者。
- `get_mcp_task_submitter`：模块级函数。这个函数返回提交者。未安装时抛出`McpTaskConfigurationError`。
- `is_mcp_task_runtime_available`：模块级函数。这个函数检查提交者是否已安装。
- `McpTaskConfigurationError`：未安装时的异常信号。
- Agent工具包装器：上游调用方。包装器通过这个协议提交任务。
- `TaskSubmitRequest`：提交请求的数据类。

## 四、重要性评级

评级：7分。

理由如下。

这个类是Agent工具层和Gateway任务服务之间的桥接协议。没有这个约定，工具包装器就要直接依赖`McpTaskService`。harness层就要依赖app层。这违反了harness和app的分层边界。

这个类还是运行时可用性的事实来源。`is_mcp_task_runtime_available`靠提交者是否安装来决定管理工具是否暴露。

这个类让工具层可测试。测试可以传入假的提交者。

依赖方明确。工具包装器依赖这个协议。Gateway提供实现。

如果删掉这个类，harness层的任务工具就要硬编码对实现类的依赖。分层边界被破坏。

但是这个类没有任何实现。这个类只是签名。

所以这个类给7分。这个类是分层边界上的关键协议。
