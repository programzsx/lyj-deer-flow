# UserContext档案

类定义在backend/app/gateway/routers/memory.py。

## 一、这个类是干什么的

这个类是用户上下文的模型。

记忆系统会了解用户的工作情况和个人偏好。这些了解分成几个方面。

这个类把用户上下文组织成几个小节。这个类是一个Pydantic模型。

## 二、类的成员

这个类有4个字段。每个字段的类型都是ContextSection。

### 1、workContext

workContext是工作上下文。

描述用户当前的工作情况。

### 2、personalContext

personalContext是个人上下文。

描述用户的个人偏好。例如喜欢简洁的回答。

### 3、topOfMind

topOfMind是当前关注点。

描述用户最近关心的事情。

### 4、cognitiveStyle

cognitiveStyle是认知风格。

描述用户稳定的思考和协作习惯。包括推理风格、思考深度、反馈模式。

## 三、它和谁协作

这个类作为MemoryResponse的user字段类型。

这个类由ContextSection小节组成。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是4分。

理由如下。

用户上下文是记忆系统的核心部分。Agent对话时会参考这些上下文。

这个类组织了4个记忆维度。cognitiveStyle是新增的稳定习惯维度。

这个类本身只是容器。所以评4分。
