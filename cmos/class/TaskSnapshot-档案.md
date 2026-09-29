# TaskSnapshot档案

## 一、这个类是干什么的

这个类是`deerflow.mcp.tasks.models`模块的数据类。

这个类的作用是承载任务驱动返回的一次归一化状态响应。

类文档写的是"One normalized status response returned by a task driver"。意思是由任务驱动返回的一次归一化状态响应。

背景是这样的。

DeerFlow支持长时运行MCP任务。

任务驱动负责和远端通信。

驱动拿到远端的原始响应后，要翻译成本地统一的形状。

`TaskSnapshot`就是那个统一的形状。

无论驱动背后是什么协议，运行时看到的都是同一个快照结构。

模块文件没有docstring。这个类的docstring承载了设计意图。

mcp的AGENTS.md说明了快照边界的约束。文档写的是驱动提供的`poll_after_seconds`必须是有限正数。校验在`TaskSnapshot`边界完成。这样所有驱动被同一个不变式约束，而不是每个驱动各自守护把间隔变成`timedelta`的消费方。

## 二、类的成员

### 1、字段

这个类是frozen dataclass，带slots。

- `status`：`TaskStatus`类型字段。这个字段记录任务的归一化状态。这是唯一必填的字段。
- `result`：任意类型字段，默认是`None`。这个字段存放任务的执行结果。
- `result_preview`：字符串字段，默认是`None`。这个字段存放结果的有限预览文本。
- `result_truncated`：布尔字段，默认是`False`。这个字段说明结果是否被截断。
- `result_artifact`：字典字段，默认是`None`。这个字段存放结果产物的URI和MIME类型。
- `error`：字符串字段，默认是`None`。这个字段存放错误描述。
- `input_required`：字典字段，默认是`None`。这个字段存放"需要输入"场景的负载。
- `poll_after_seconds`：浮点字段，默认是`None`。这个字段是驱动建议的下一次轮询间隔。

### 2、方法

- `__post_init__`：构造后的校验方法。这个方法做三件事。第一件，`status`不是`TaskStatus`实例时转换成枚举。第二件，`poll_after_seconds`不是有限正数时抛出`ValueError`。NaN和无穷大能通过普通的`<= 0`检查。源码注释解释了原因。NaN和无穷大会破坏消费方。消费方把这个间隔变成`timedelta`。第三件，状态是`INPUT_REQUIRED`但`input_required`是`None`时抛出`ValueError`。说需要输入就必须给负载。
- `is_pollable`：属性。输出是布尔值。状态在可轮询集合里返回`True`。运行时靠这个属性决定是否继续轮询。
- `needs_attention`：属性。输出是布尔值。状态在需要注意集合里返回`True`。运行时靠这个属性决定是否投递通知。

## 三、它和谁协作

这个类和以下对象协作。

- `TaskStatus`：快照的`status`字段就是这个枚举。三个状态集合支撑两个属性。
- `OrdinaryMcpTaskDriver`：驱动的`get_status`和`cancel`方法返回这个快照。`_snapshot_from_status`函数构造快照。
- `McpTaskDriver`：协议声明了`get_status`和`cancel`的返回类型是这个快照。
- `TaskSubmission`：提交结果里的`snapshot`字段是这个快照类型。
- `McpTaskService`：任务运行时消费快照。运行时读取`is_pollable`和`needs_attention`决定后续动作。
- `persistence/mcp_tasks/`：持久化层把快照写回数据库。

## 四、重要性评级

评级：8分。

理由如下。

这个类是全部任务状态信息的统一载体。驱动返回什么，运行时看到什么，数据库存什么，全部经过这个快照。没有这个类，状态信息就是松散的字典。

快照边界校验是系统文档明确记录的设计。`poll_after_seconds`的有限正数校验在边界完成。所有驱动被同一个不变式约束。`input_required`必须有负载。这些校验保证下游消费安全。

`is_pollable`和`needs_attention`两个属性是运行时调度的直接依据。

依赖方多。两个驱动方法返回快照。`McpTaskService`消费快照。持久化层写快照。如果删掉这个类，整个任务状态流转失去统一形状。

不给满分的原因是。这个类本体仍然是数据容器。复杂逻辑在使用方那里。

所以这个类给8分。
