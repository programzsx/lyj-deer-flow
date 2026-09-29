# TokenUsageResponse档案

类定义在backend/app/gateway/routers/models.py。

## 一、这个类是干什么的

这个类是token用量显示配置的响应体。

前端想知道要不要显示token用量。前端调用模型列表接口时一并获取这个配置。

这个类是一个Pydantic模型。这个类只有1个字段。

## 二、类的成员

这个类有1个字段。

### 1、enabled

enabled表示是否开启token用量显示。

这个字段是布尔类型。默认是false。

取值来自config.yaml的token_usage.enabled配置。

enabled为false时前端隐藏token用量显示。

## 三、它和谁协作

这个类作为ModelsListResponse的token_usage字段类型。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是2分。

理由如下。

这个类只有1个字段。这个类只是一个布尔开关的载体。

显示配置的实际判断在配置系统里。

所以评2分。
