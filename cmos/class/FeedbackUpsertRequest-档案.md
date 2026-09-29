# FeedbackUpsertRequest档案

类定义在backend/app/gateway/routers/feedback.py。

## 一、这个类是干什么的

这个类是创建或更新反馈的请求体。

用户可能对同一次运行重复提交反馈。upsert接口会创建或更新。重复提交不会产生重复记录。

前端调用PUT /api/threads/{thread_id}/runs/{run_id}/feedback接口。后端用这个类接收反馈。

这个类是一个Pydantic模型。

这个类和FeedbackCreateRequest几乎一样。区别是这个类没有message_id字段。

## 二、类的成员

这个类有2个字段。

### 1、rating

rating是反馈评分。

这个字段是整数类型。这个字段必填。

合法值只有两个。1表示好评。负1表示差评。

路由函数会校验这个字段。其他值返回400。

### 2、comment

comment是可选的文字反馈。

这个字段是字符串类型。这个字段默认是None。

## 三、它和谁协作

这个类被PUT /api/threads/{thread_id}/runs/{run_id}/feedback路由使用。

这个类作为upsert_feedback函数的body参数。

这个路由需要threads:write权限。路由会校验运行存在且属于该对话。

数据最终写入FeedbackRepository的upsert方法。upsert保证幂等。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是3分。

理由如下。

这个类和FeedbackCreateRequest高度重复。这个类少了message_id字段。

这个类只承载2个字段。upsert逻辑在仓库层。

所以评3分。
