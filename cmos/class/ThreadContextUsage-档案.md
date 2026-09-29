# ThreadContextUsage档案

类定义在backend/app/gateway/routers/thread_runs.py。

## 一、这个类是干什么的

这个类是对话上下文用量的模型。

对话的上下文有容量上限。上下文用量表示当前用了多少。用了百分之多少。

这个类是一个Pydantic模型。这个类只有3个字段。

## 二、类的成员

这个类有3个字段。

### 1、token_count

token_count是当前上下文的token数量。这个字段是整数类型。默认是0。

### 2、max_context_tokens

max_context_tokens是上下文的容量上限。

这个字段是整数类型。默认是None。

上限来自最新一次运行使用的模型和该模型的上下文窗口。

### 3、percentage

percentage是上下文用量的百分比。

这个字段是浮点数类型。默认是None。

前端用这个字段显示上下文占用进度条。

## 三、它和谁协作

这个类被GET /api/threads/{id}/token-usage路由使用。

这个类作为ThreadTokenUsageResponse的context_usage字段类型。字段可以为None。

上下文消息计数从最近的物化线程状态算起。全量检查点和增量检查点给出相同的输入。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是4分。

理由如下。

上下文用量是用户关心的信息。用量满了对话质量会下降。

percentage字段驱动前端的用量提示。

所以评4分。
