# McpTaskDriver档案

## 一、这个类是干什么的

这个类是`deerflow.mcp.tasks.driver`模块的协议类。

这个类的作用是声明任务驱动的传输和协议适配能力。

类文档写的是"Transport/protocol adapter used by the protocol-neutral task runtime"。意思是被协议中立的任务运行时使用的传输和协议适配器。

背景是这样的。

DeerFlow支持长时运行MCP任务。

任务运行时是协议中立的。运行时不关心远端任务用什么协议操作。

不同的任务类型需要不同的驱动。

普通三工具契约需要`OrdinaryMcpTaskDriver`。

将来可能有其他契约，例如原生API驱动。

`McpTaskDriver`就是这个适配层的类型约定。运行时只依赖这个约定。

模块文件没有docstring。这个类的docstring承载了设计意图。

这个类是Protocol协议类。这个类只定义方法签名，不提供实现。

## 二、类的成员

这个类声明三个方法。

- `submit`：异步方法。输入是`TaskSubmitRequest`。输出是`TaskSubmission`。这个方法提交一个任务。请求对象是协议中立的。返回对象携带远端任务句柄和初始状态。
- `get_status`：异步方法。输入是`TaskReference`。输出是`TaskSnapshot`。这个方法查询任务状态。引用对象携带驱动需要的稳定数据。返回对象是归一化的状态快照。
- `cancel`：异步方法。输入是`TaskReference`。输出是`TaskSnapshot`。这个方法取消任务。返回对象描述取消后的状态。

三个方法的输入输出类型全部来自`deerflow.mcp.tasks.models`模块。这保证了协议中立性。运行时和驱动之间只传这四个数据类。

## 三、它和谁协作

这个类和以下对象协作。

- `OrdinaryMcpTaskDriver`：这个协议的一个实现。普通三工具契约的驱动。
- `McpTaskDriverRegistry`：驱动目录。注册表存储`McpTaskDriver`类型的对象。
- `McpTaskService`：任务运行时。运行时通过`resolve`逻辑解析驱动并调用三个方法。
- `TaskSubmitRequest`、`TaskSubmission`、`TaskReference`、`TaskSnapshot`：四个数据类。这些类是协议的输入输出载体。

## 四、重要性评级

评级：7分。

理由如下。

这个类是长时任务体系的协议中立接缝。运行时和驱动之间的全部交互都通过这个约定。没有这个约定，运行时就耦合具体协议。

这个类让运行时可扩展。新协议只需要实现三个方法。运行时代码不用改。

这个类的三个方法覆盖了任务的全部生命周期。提交、查询、取消。

依赖方多。`McpTaskService`、`McpTaskDriverRegistry`、`OrdinaryMcpTaskDriver`都依赖这个约定。

如果删掉这个类，运行时就失去协议中立性。每加一种协议就要改一次运行时。

但是这个类没有任何实现。这个类只是签名。

所以这个类给7分。这个类是架构上的核心约定，但本体只有签名。
