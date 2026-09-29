# ModelsListResponse档案

类定义在backend/app/gateway/routers/models.py。

## 一、这个类是干什么的

这个类是列出所有模型的响应体。

前端调用GET /api/models接口。前端要展示模型选择器。

后端用这个类把模型列表和token用量显示配置打包返回。这个类是一个Pydantic模型。

## 二、类的成员

这个类有2个字段。

### 1、models

models是模型列表。

这个字段类型是ModelResponse列表。这个字段必填。

开启授权时只返回调用者角色可以查看的模型。授权失败时按fail_closed策略返回空列表或全部。

### 2、token_usage

token_usage是token用量显示配置。

这个字段类型是TokenUsageResponse。这个字段必填。

前端用这个字段决定要不要显示token用量。

## 三、它和谁协作

这个类被GET /api/models路由使用。

这个类作为list_models函数的response_model。

models字段由ModelResponse列表组成。token_usage字段由TokenUsageResponse组成。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是4分。

理由如下。

模型列表是前端模型选择器的数据来源。每个用户都会用到。

这个类组织了模型列表和显示配置。这个类本身只是聚合容器。

所以评4分。
