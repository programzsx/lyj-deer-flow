# BeforeSummarizationHook档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/summarization_middleware.py`

## 一、这个类是干什么的

BeforeSummarizationHook是摘要删除消息之前调用的钩子协议。

摘要中间件压缩对话历史时。
被压缩的消息会从状态里删掉。
删掉之前中间件调用这个钩子。
把事件交给钩子。

钩子可以做任何事。
当前的实现是记忆入队。
把被压缩的消息存进记忆队列。

这是一个Protocol。
它只定义调用形状。不提供实现。
新的钩子实现这个协议。注册进去就能在压缩前收到事件。

## 二、类的成员

### （一）字段

BeforeSummarizationHook没有字段。

### （二）方法

- `__call__`：接收一个SummarizationEvent。无返回值。

## 三、它和谁协作

- DeerFlowSummarizationMiddleware的`_fire_hooks`调用它。
- SummarizationEvent是它接收的事件。
- memory_flush_hook是当前的实现。进记忆入队。

## 四、重要性评级

评级：3/10。

理由：BeforeSummarizationHook是一个协议定义。它本身没有实现。它的价值在于把压缩和钩子解耦。记忆入队靠这个口子。所以给结构性贡献3分。