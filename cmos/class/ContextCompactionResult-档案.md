# ContextCompactionResult档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/summarization_middleware.py`

## 一、这个类是干什么的

ContextCompactionResult是一次上下文压缩的结果记录。

压缩做的事情是把老上下文摘要掉。保留活动尾部。

结果里装了四个信息。

摘要文本。被摘要掉的消息。保留下来的消息。总token数。还有可选的任务历史。

调用方凭这个结果写checkpoint。更新summary_text。

## 二、类的成员

### （一）字段

- `summary_text`：生成的摘要文本。
- `messages_to_summarize`：被摘要掉的消息元组。
- `preserved_messages`：保留下来的消息元组。
- `total_tokens`：压缩涉及的总token数。
- `task_history`：可选的任务历史。默认None。

### （二）方法

ContextCompactionResult没有定义自己的方法。
它是纯数据。

## 三、它和谁协作

- DeerFlowSummarizationMiddleware的compact_state产出它。
- Gateway的compact路由消费它写新checkpoint。

## 四、重要性评级

评级：4/10。

理由：ContextCompactionResult是压缩结果的数据载体。手动压缩的checkpoint写入靠它。它是纯数据。逻辑在中间件里。所以给4分。