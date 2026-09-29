# _TaskOwner档案

## 一、这个类是干什么的

这个类是`deerflow.mcp.task_tool_caller`模块的内部辅助类。

类名以下划线开头。这个命名说明这个类是内部实现细节。外部代码不应该直接使用这个类。

这个类的作用是给后台MCP调用提供一个只有ID的用户身份。

类文档写的是"ID-only CurrentUser for background MCP auth; no profile or role data"。意思是为后台MCP认证提供只有ID的CurrentUser，不带档案和角色数据。

背景是这样的。

持久任务的取消和状态查询运行在源头Agent回合结束之后。

那时没有活跃的Agent运行。也没有运行上下文。

用户级认证拦截器需要从当前用户身份解析凭证。

没有身份，拦截器拒绝每次调用。

`_TaskOwner`解决了这个问题。调用前把持有`_TaskOwner`绑定到现有用户ContextVar。调用结束后恢复原值。

模块docstring写的是"Exact-name MCP calls used by the durable ordinary-task driver"。意思是持久普通任务驱动使用的精确名称MCP调用。这个类是后台调用的身份载体。

mcp的AGENTS.md文档说明了设计边界。文档写的是"Background task identity"。要点是只绑定`.id`。`CurrentUser`契约只保证`.id`字段，不保证档案字段或角色。不允许持久化请求密钥，也不允许为后台调用启用`headers_from_context`。

## 二、类的成员

### 1、字段

这个类是dataclass。

- `id`：字符串字段。这个字段存放任务属主的用户ID。这是这个类唯一的字段。

### 2、行为

这个类是纯数据类。这个类没有定义业务方法。

`McpTaskToolCaller._invoke`方法消费这个类。流程是这样的。

第一步。判断这次调用是不是后台调用。判断标准是`request_scoped_headers`为`False`。

第二步。后台调用且目标服务器启用了`user_auth`时，构造`_TaskOwner(id=background_user_id)`。

第三步。调用`set_current_user`把这个属主绑定到用户ContextVar。绑定返回一个token。

第四步。执行调用。finally块里调用`reset_current_user`恢复原上下文。

ContextVar状态让不同用户的并行轮询保持隔离。

## 三、它和谁协作

这个类和以下对象协作。

- `McpTaskToolCaller`：这个类的唯一使用方。`_invoke`方法构造这个类并绑定到ContextVar。
- `deerflow.runtime.user_context`模块：提供`set_current_user`和`reset_current_user`。绑定和恢复靠这个模块。
- 用户级认证拦截器：拦截器从ContextVar读取身份。`_TaskOwner`的`.id`就是拦截器读到的值。

## 四、重要性评级

评级：5分。

理由如下。

这个类是后台任务认证身份的最小载体。没有这个类，持久任务的取消和状态轮询在Agent回合结束后无法通过用户级认证。轮询会全部失败。

这个类的设计很克制。只带`.id`。这符合`CurrentUser`契约的最小保证。多带字段就是多一份风险。

但是这个类只有一个字段。这个类的逻辑全部在使用方`McpTaskToolCaller`里。

这个类是内部实现细节。外部代码不直接引用这个类。如果删掉这个类，可以用一个轻量替代对象顶上。

所以这个类给5分。这个类处在关键链路上，但本体极小。
