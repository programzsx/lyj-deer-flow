# EditRegeneratePrepareRequest档案

类定义在backend/app/gateway/routers/thread_runs.py。

## 一、这个类是干什么的

这个类是编辑后重新运行的请求体。

用户想修改自己之前的提问。然后重新运行这次提问。这和重新生成不同。重新生成只是重跑同一次提问。

前端调用POST /api/threads/{id}/runs/edit-regenerate/prepare接口。后端用这个类定位要编辑的消息和新文字。这个类是一个Pydantic模型。

## 二、类的成员

这个类有2个字段。

### 1、human_message_id

human_message_id是要编辑的原始用户消息编号。

这个字段是字符串类型。这个字段必填。最短1个字符。

### 2、replacement_text

replacement_text是替换后的用户可见文字。

这个字段是字符串类型。这个字段必填。最短1个字符。

## 三、它和谁协作

这个类被POST /api/threads/{id}/runs/edit-regenerate/prepare路由使用。

准备会从最近的可编辑用户回合建立检查点重放。替换消息替换原用户消息。

准备还会携带当前对话标题。但只在重放基础已有标题时携带。未命名的对话标题绑定在被替换的提示词上。不能固定到新的提示词。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是4分。

理由如下。

编辑后重跑是对话的重要交互。用户改错字或补充信息后重新运行。

这个类承载编辑的两个必要信息。

所以评4分。
