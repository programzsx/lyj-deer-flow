# AgentsApiFeature档案

类定义在backend/app/gateway/routers/features.py。

## 一、这个类是干什么的

这个类是自定义Agent管理功能的可用性标记。

前端启动时调用GET /api/features接口。前端想知道哪些功能可用。前端根据结果决定要不要显示相关UI。

这个类告诉前端自定义Agent管理接口是否开放。这个类是一个Pydantic模型。

这个类只有1个字段。这个类是FeaturesResponse的组成部分。

## 二、类的成员

这个类有1个字段。

### 1、enabled

enabled表示agents_api路由是否通过HTTP开放。

这个字段是布尔类型。这个字段必填。

取值来自config.yaml的agents_api.enabled配置。配置修改后下一次请求立即生效。

enabled为false时。前端不显示自定义Agent管理的界面。

## 三、它和谁协作

这个类被GET /api/features路由使用。

这个类作为FeaturesResponse的agents_api字段类型。

这个类继承了Pydantic的BaseModel。

数据来源是deerflow.config.app_config模块的AppConfig。

## 四、重要性评级

评分是3分。

理由如下。

这个类只是一个功能开关的载体。这个类只有1个字段。

功能开关的判断逻辑在路由函数和配置系统里。

前端靠这类标记避免发出后端会拒绝的请求。所以这个类有基础作用。
