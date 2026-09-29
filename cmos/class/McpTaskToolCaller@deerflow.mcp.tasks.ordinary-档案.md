# McpTaskToolCaller@deerflow.mcp.tasks.ordinary档案

## 一、这个类是干什么的

这个类是`deerflow.mcp.tasks.ordinary`模块的一个协议类。

注意。DeerFlow里有两个同名类。这份档案讲的是`mcp.tasks.ordinary`模块的版本。另一个同名类在`mcp.task_tool_caller`模块里。

两个同名类的区别是这样的。

`mcp.task_tool_caller`模块的`McpTaskToolCaller`是一个具体类。那个类真正发起MCP调用，处理会话、令牌、拦截器、身份绑定等全部细节。

本模块的`McpTaskToolCaller`是一个Protocol协议类。Protocol是Python的类型协议。这个类只定义方法签名，不提供实现。

这个类的作用是给任务驱动声明一个调用能力。

类定义只声明了一个`call_tool`方法的签名。方法体是`...`，没有任何实现。

类没有docstring。方法也没有docstring。这个类是纯粹的类型约定。

背景是这样的。

`OrdinaryMcpTaskDriver`需要一个能调用MCP工具的对象。

驱动不关心调用对象的具体实现。驱动只关心调用对象有`call_tool`方法。

Protocol让驱动可以用任何满足签名的对象初始化。具体实现类不需要继承这个Protocol。Python的结构化类型系统会自动匹配。

这个设计解耦了驱动和调用实现。测试时可以传入假调用对象。生产时传入真实实现。

## 二、类的成员

这个类只声明一个方法。

- `call_tool`：异步方法。这是唯一的成员。关键字参数有七个。这七个参数是`server_name`、`tool_name`、`arguments`、`user_id`、`thread_id`、`thread_incarnation`、`request_scoped_headers`、`connection_scope`。实际是八个参数。输出类型是`Any`。参数说明如下。
  - `server_name`：字符串。目标MCP服务器名。
  - `tool_name`：字符串。要调用的原始工具名。
  - `arguments`：字典。工具参数。
  - `user_id`：字符串。调用者的用户ID。
  - `thread_id`：字符串。调用所在的线程ID。
  - `thread_incarnation`：可选字符串。线程化身的版本标识。默认是`None`。
  - `request_scoped_headers`：布尔值。默认是`False`。这个标志说明是否携带请求级凭证头。
  - `connection_scope`：字面量类型。取值是`"deployment"`或`"personal"`。默认是`"deployment"`。这个参数说明连接是部署级还是个人级。

## 三、它和谁协作

这个类和以下对象协作。

- `OrdinaryMcpTaskDriver`：这个类的主要消费方。`OrdinaryMcpTaskDriver.__init__`的参数类型就是这个Protocol。驱动持有这个类型的对象并调用`call_tool`。
- `McpTaskToolCaller`（task_tool_caller模块版本）：生产实现。那个具体类的`call_tool`签名与本协议完全一致。结构化类型让那个实例可以直接传给`OrdinaryMcpTaskDriver`。
- 测试代码：测试可以传入任何满足签名的假对象。

## 四、重要性评级

评级：5分。

理由如下。

这个类是驱动和调用实现之间的类型契约。没有这个Protocol，驱动的参数类型就要写成具体类。驱动就依赖具体实现。测试就不方便替换。

这个类定义的签名很重要。`request_scoped_headers`和`connection_scope`这两个参数的语义通过这个签名传播。签名是提交凭证分离和个人连接作用域的类型基础。

但是这个类没有任何实现。这个类只有一个方法签名。如果删掉这个类，可以改用具体类型标注，代价是耦合和可测试性下降。

这个类是内部模块的类型辅助。外部代码很少直接引用这个Protocol。

所以这个类给5分。这个类是架构上的关键接缝，但本体很小。
