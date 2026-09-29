# FeedbackCreateRequest档案

类定义在backend/app/gateway/routers/feedback.py。

## 一、这个类是干什么的

这个类是提交反馈的请求体。

用户可以对一次运行点赞或点踩。用户还可以附加文字评论。

前端调用POST /api/threads/{thread_id}/runs/{run_id}/feedback接口。后端用这个类接收反馈。

这个类是一个Pydantic模型。

## 二、类的成员

这个类有3个字段。

### 1、rating

rating是反馈评分。

这个字段是整数类型。这个字段必填。

合法值只有两个。1表示好评。负1表示差评。

路由函数会校验这个字段。其他值返回400。

### 2、comment

comment是可选的文字反馈。

这个字段是字符串类型。这个字段默认是None。

用户可以写具体的使用感受。也可以不写。

### 3、message_id

message_id是可选的消息编号。

这个字段是字符串类型。这个字段默认是None。

这个字段把反馈限定到某条具体消息。不传就是整次运行的反馈。

## 三、它和谁协作

这个类被POST /api/threads/{thread_id}/runs/{run_id}/feedback路由使用。

这个类作为create_feedback函数的body参数。

这个路由需要threads:write权限。路由会校验运行存在且属于该对话。

数据最终写入FeedbackRepository。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是4分。

理由如下。

用户反馈是产品改进的重要数据来源。这个类是创建反馈的唯一入口格式。

这个类只有3个字段。校验逻辑在路由函数里。

rating字段是核心。comment和message_id是可选扩展。所以评4分。
