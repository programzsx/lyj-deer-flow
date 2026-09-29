# ReadBeforeWriteMiddleware档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/read_before_write_middleware.py`

## 一、这个类是干什么的

ReadBeforeWriteMiddleware是针对改文件工具的确定性先读后写门槛。

背景是这样的。

lead agent有一种重复输出失败模式。
同一段报告被追加了五遍。
根因是"只追加、从不读回"的写法。

这个中间件强制一个版本门槛。
修改已存在的文件要求在本次会话里先读过这个文件的当前版本。

设计有几个不变量。

第一是工具保持无状态。读标记是完整文件内容的sha256。盖在read_file的ToolMessage的additional_kwargs上。门槛的状态就活在消息列表里。

第二是摘要删掉读结果就删掉了标记。读内容不在上下文里门槛就绝不会通过。

第三是写操作永远不刷新标记。任何成功写入都改变文件哈希。因此让之前所有读标记失效。连续两次修改之间必须重新读。

第四是门槛检查和工具执行按范围加路径串行。LangGraph会并发跑一个AI消息的多个工具调用。没有临界区的话两个同轮写操作可能在同一个过期标记上都通过。同一把锁也盖住read_file加标记盖戳。保证标记哈希的永远是模型实际看到的版本。

第五是失败放行。门槛自己无法检查文件时。比如沙箱打嗝、二进制内容、或者用"Error: ..."字符串报读失败的沙箱。放行让工具自己报错。

第六是被阻止的载荷是死重。调用没执行。门槛要求重读加重新调用。模型反正要重新发出内容。所以模型绑定的请求里。被阻止调用的载荷参数换成短的确定性占位符。状态消息、工具回执、运行日志保留原始参数。

## 二、类的成员

### （一）字段

没有声明公开字段。

### （二）方法

钩子方法是重点。

- `wrap_tool_call`和`awrap_tool_call`：工具调用边界。读操作盖标记。写操作查门槛。不过就阻止。
- `wrap_model_call`和`awrap_model_call`：模型调用边界。把被阻止调用的死载荷换成占位符。

核心方法：

- `release_policy_parameters`：声明影响行为的配置。
- `_check_write_gate`：查写门槛。返回阻止消息或None。
- `_attach_read_mark`：给读结果盖内容哈希标记。
- `_latest_mark_hash`：从状态里找某路径最新的读标记哈希。
- `_requested_path`：从工具调用参数里取路径。
- `_lock_for`和`_lock_scope`：按范围加路径拿锁。范围按线程或沙箱隔离。
- `_elide_blocked_payloads`：把被阻止调用的载荷参数换成占位符。
- `_authorization_error_result`：沙箱授权错误变成正常工具级拒绝。不失败放行也不弄垮运行。

## 三、它和谁协作

- 它挂在中间件链的工具调用边界上。位置在ToolProgress和ToolErrorHandling外面。
- 它和SandboxMiddleware协作。读文件和比对哈希走沙箱。
- 它盖的deerflow_write_block标记被审计消费。
- ToolOutputBudgetMiddleware的载荷省略和它共用tool_call_args辅助器。
- 被它阻止的调用不占ToolProgress的问题计数。

## 四、重要性评级

评级：8/10。

理由：重复追加输出是用户可直接观察到的失败。它会毁掉报告和文件。这个中间件用确定性的版本门槛根治了它。临界区和失败放行的取舍都想清楚了。它只管文件写入这一个面。所以不给9分以上。