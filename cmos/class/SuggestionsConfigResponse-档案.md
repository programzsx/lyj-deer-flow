# SuggestionsConfigResponse档案

类定义在backend/app/gateway/routers/suggestions.py。

## 一、这个类是干什么的

这个类是建议配置的响应体。

前端想知道后续建议功能是否开启。还要知道最多能生成几条。

前端调用GET /api/suggestions/config接口。后端用这个类返回配置。这个类是一个Pydantic模型。

## 二、类的成员

这个类有2个字段。

### 1、enabled

enabled表示后续建议是否全局开启。

这个字段是布尔类型。这个字段必填。

### 2、max_suggestions

max_suggestions是后续建议的最大数量。

这个字段是整数类型。最小1。最大是MAX_SUGGESTIONS_LIMIT。这个字段必填。

## 三、它和谁协作

这个类被GET /api/suggestions/config路由使用。

数据来自config.yaml的suggestions配置块。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是2分。

理由如下。

这个类只有2个字段。这个类只是配置的载体。

前端用它决定要不要请求建议。

所以评2分。
