# ThreadCompactResponse档案

类定义在backend/app/gateway/routers/threads.py。

## 一、这个类是干什么的

这个类是手动压缩对话上下文的响应体。

压缩完成后。后端用这个类告诉前端压缩的结果。压缩了多少消息。保留了多少消息。总token是多少。

这个类是一个Pydantic模型。

## 二、类的成员

这个类有8个字段。

### 1、thread_id

thread_id是对话编号。这个字段是字符串类型。这个字段必填。

### 2、compacted

compacted表示是否执行了压缩。这个字段是布尔类型。这个字段必填。

### 3、reason

reason是未压缩时的原因。这个字段是字符串类型。默认是None。

### 4、removed_message_count

removed_message_count是被总结移除的消息数。这个字段是整数类型。默认是0。

### 5、preserved_message_count

preserved_message_count是保留的消息数。这个字段是整数类型。默认是0。

### 6、summary_updated

summary_updated表示总结文字是否更新。这个字段是布尔类型。默认是false。

### 7、checkpoint_id

checkpoint_id是压缩产生的新检查点编号。这个字段是字符串类型。默认是None。

### 8、total_tokens

total_tokens是压缩后的总token数。这个字段是整数类型。默认是0。

## 三、它和谁协作

这个类被POST /api/threads/{id}/compact路由使用。

压缩复用共享的总结中间件。压缩写新的检查点。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是4分。

理由如下。

这个类是压缩结果的完整报告。前端展示压缩效果靠它。

字段区分了移除和保留的消息数。支持用户理解压缩幅度。

所以评4分。
