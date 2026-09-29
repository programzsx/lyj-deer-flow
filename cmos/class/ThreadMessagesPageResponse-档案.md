# ThreadMessagesPageResponse档案

类定义在backend/app/gateway/routers/thread_runs.py。

## 一、这个类是干什么的

这个类是对话消息分页的响应体。

前端要分页加载对话的消息。消息按序号排列。

后端用这个类返回一页消息和分页游标。这个类是一个Pydantic模型。

## 二、类的成员

这个类有3个字段。

### 1、data

data是本页的消息列表。

这个字段是字典列表类型。这个字段必填。

每条消息是一个字典。包含角色、内容等。

### 2、has_more

has_more表示是否还有更早的消息。这个字段是布尔类型。这个字段必填。

### 3、next_before_seq

next_before_seq是下一页的序号游标。

这个字段是整数类型。默认是None。

传这个序号拿更早的一页。

## 三、它和谁协作

这个类被GET /api/threads/{id}/messages/page路由使用。

这个接口是向后兼容的线程全局历史页。带中间件、子Agent AI、成功重新生成、编辑重放的过滤。

过滤逻辑在路由函数里。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是4分。

理由如下。

消息分页是前端加载长对话的核心机制。按序号分页保证顺序稳定。

重新生成和编辑重放的消息过滤影响UI展示。

所以评4分。
