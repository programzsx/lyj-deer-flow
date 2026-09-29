# FeedbackResponse档案

类定义在backend/app/gateway/routers/feedback.py。

## 一、这个类是干什么的

这个类是反馈记录的响应体。

用户提交反馈后。后端用这个类把保存的反馈记录返回给前端。

查询反馈列表时也用这个类。列表里的每一条就是一份反馈记录。

这个类是一个Pydantic模型。这个类只承载数据。

## 二、类的成员

这个类有8个字段。

### 1、feedback_id

feedback_id是反馈记录的唯一编号。这个字段是字符串类型。

### 2、run_id

run_id是反馈所属的运行编号。这个字段是字符串类型。

### 3、thread_id

thread_id是反馈所属的对话编号。这个字段是字符串类型。

### 4、user_id

user_id是提交反馈的用户编号。这个字段是字符串类型。可以为None。

### 5、message_id

message_id是反馈限定到的消息编号。这个字段是字符串类型。可以为None。

### 6、rating

rating是反馈评分。这个字段是整数类型。1是好评。负1是差评。

### 7、comment

comment是文字反馈。这个字段是字符串类型。可以为None。

### 8、created_at

created_at是反馈创建时间。这个字段是字符串类型。默认是空字符串。

## 三、它和谁协作

这个类被三个路由使用。

POST /api/threads/{thread_id}/runs/{run_id}/feedback创建反馈时返回这个类。

PUT /api/threads/{thread_id}/runs/{run_id}/feedback更新反馈时返回这个类。

GET /api/threads/{thread_id}/runs/{run_id}/feedback列出反馈时返回这个类的列表。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是3分。

理由如下。

这个类只是反馈记录的响应容器。这个类有8个字段但都是简单数据字段。

反馈的创建和统计逻辑在仓库层。

这个类让前端能展示反馈详情。所以这个类有基础作用。
