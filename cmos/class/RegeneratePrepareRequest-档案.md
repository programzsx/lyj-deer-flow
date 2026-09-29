# RegeneratePrepareRequest档案

类定义在backend/app/gateway/routers/thread_runs.py。

## 一、这个类是干什么的

这个类是准备重新生成回答的请求体。

用户对某次助手回答不满意。用户想重新生成这次回答。重新生成需要先准备干净的输入和检查点。

前端调用POST /api/threads/{id}/runs/regenerate/prepare接口。后端用这个类定位要重新生成的消息。这个类是一个Pydantic模型。

## 二、类的成员

这个类有1个字段。

### 1、message_id

message_id是要重新生成的助手消息编号。

这个字段是字符串类型。这个字段必填。最短1个字符。

## 三、它和谁协作

这个类被POST /api/threads/{id}/runs/regenerate/prepare路由使用。

准备接口返回干净输入和检查点元数据。前端拿这些数据调用重新生成。

准备时会处理隐藏的human_input_response消息。协议合法的隐藏回答算作确认的重放输入。其他隐藏消息被拒绝。

准备还会携带最新的非空对话标题。避免恢复旧检查点时回滚后来的手动重命名。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是4分。

理由如下。

重新生成是对话的高频操作。这个类是重新生成准备的唯一入口格式。

这个类只有1个字段。准备的复杂逻辑在路由函数里。

所以评4分。
