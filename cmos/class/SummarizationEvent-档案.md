# SummarizationEvent档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/summarization_middleware.py`

## 一、这个类是干什么的

SummarizationEvent是摘要发生前发出的事件。

摘要中间件要把对话历史压缩掉之前。
先触发before_summarization钩子。
把即将被压缩的消息交给钩子。

事件里装了全部上下文。

被摘要的消息。保留的消息。线程id。代理名。运行时对象。

钩子凭这些信息做事。
比如记忆入队钩子把被压缩的消息存进记忆队列。
如果压缩直接删掉了消息而不先发事件。
那些消息就永远丢了。记忆提取再也没机会看到它们。

## 二、类的成员

### （一）字段

- `messages_to_summarize`：即将被摘要掉的消息元组。
- `preserved_messages`：保留下来的消息元组。
- `thread_id`：线程id。
- `agent_name`：代理名。
- `runtime`：运行时对象。用于user_id解析。

### （二）方法

SummarizationEvent没有定义自己的方法。
它是纯数据。

## 三、它和谁协作

- DeerFlowSummarizationMiddleware的`_fire_hooks`构造并发出它。
- BeforeSummarizationHook协议定义了钩子形状。
- memory_flush_hook消费它。把消息入队记忆。

## 四、重要性评级

评级：5/10。

理由：SummarizationEvent是压缩和记忆入队之间的桥。没有它压缩掉的消息就永久丢失。记忆功能会漏掉被压缩的对话。它是纯数据。所以给5分。