# TaskReference档案

## 一、这个类是干什么的

这个类是`deerflow.mcp.tasks.models`模块的数据类。

这个类的作用是承载任务驱动在源头Agent运行结束后需要的稳定数据。

类文档写的是"Stable data a driver needs after the originating Agent run has ended"。意思是在源头Agent运行结束后，驱动需要的稳定数据。

背景是这样的。

DeerFlow支持长时运行MCP任务。

任务提交发生在Agent回合内。

任务的状态查询和取消发生在Agent回合结束后。

那时运行上下文已经不在了。

驱动需要一组稳定数据才能继续操作远端任务。

这组数据包括本地任务ID、用户ID、线程ID、服务器名、远端任务ID、驱动私有数据。

`TaskReference`就是这组数据的载体。

模块文件没有docstring。这个类的docstring承载了设计意图。

## 二、类的成员

### 1、字段

这个类是frozen dataclass，带slots。

- `local_task_id`：字符串字段。这个字段记录本地数据库里的任务ID。
- `user_id`：字符串字段。这个字段记录任务属主的用户ID。后台调用的身份绑定靠这个ID。
- `thread_id`：字符串字段。这个字段记录任务所在的线程ID。会话隔离靠这个ID。
- `server_name`：字符串字段。这个字段记录目标MCP服务器名。
- `remote_task_id`：字符串字段。这个字段记录远端任务ID。状态查询和取消都靠这个ID。
- `driver_data`：字典字段，默认空字典。这个字段存放驱动私有的配置数据。普通驱动用这个字典存绑定工具名和连接作用域。
- `thread_incarnation`：可选字符串字段，默认是`None`。这个字段记录线程化身的版本标识。

### 2、方法

- `from_record`：类方法。输入是数据库记录字典。输出是`TaskReference`实例。这个方法从持久化记录构造引用。流程是逐个字段取出。`thread_incarnation`用`record.get("_thread_incarnation")`读取。源码注释解释了原因。混合版本或自定义存储可能仍然发出旧形状的记录。这个读取保留了旧记录里显式NULL会话作用域。

## 三、它和谁协作

这个类和以下对象协作。

- `McpTaskDriver`：协议声明了`get_status`和`cancel`的输入类型是这个引用。
- `OrdinaryMcpTaskDriver`：驱动的`get_status`和`cancel`方法消费这个引用。驱动从`driver_data`里读工具名和连接作用域。
- `McpTaskService`：任务运行时从持久化记录构造引用，传给驱动。
- `persistence/mcp_tasks/`：持久化层提供数据库记录。`from_record`从记录构造引用。
- `TaskSnapshot`：引用作为输入，快照作为输出。两者是驱动的进和出。

## 四、重要性评级

评级：6分。

理由如下。

这个类是驱动后台操作的数据基础。状态查询和取消全部发生在Agent回合结束后。没有这组稳定数据，驱动无法定位远端任务。

`from_record`方法保持了旧记录形状的兼容。混合版本存储的显式NULL会话作用域得以保留。这个细节避免了升级期间的会话作用域错乱。

`driver_data`字段是驱动扩展点。普通驱动把绑定配置放这里。新驱动可以放自己的私有数据。

依赖方明确。协议、驱动、运行时、持久化层都在这条链路上。如果删掉这个类，后台轮询失去数据载体。

但是这个类本体是纯数据容器。这个类只有一个转换方法。

所以这个类给6分。
