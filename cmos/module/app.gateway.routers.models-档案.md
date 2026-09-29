# app.gateway.routers.models-档案

源码路径是backend/app/gateway/routers/models.py。

## 一、这个模块是干什么的

models.py是模型查询路由。

前端需要知道有哪些模型可用。

模型列表来自config.yaml的models段。

这个模块负责列模型和查模型。

这个模块只有202行。

## 二、模块里的主要成员

路由前缀是/api。

### 1、端点列表

- GET "/models"列出全部模型。
- GET "/models/{name}"读取单个模型详情。

### 2、授权

authorize_model_use检查模型使用授权。

授权开启时，无权使用的模型对用户不可见。

_AuthorizationUnavailable表示授权服务不可用。

授权不可用时按策略决定放行或拒绝。

_model_response把ModelConfig转成响应模型。

## 三、它和谁协作

上游是前端模型选择器。

下游是config.yaml的models配置。

授权走app.gateway.authz的authorize_model_use。

这个模块是纯读的。

不依赖数据库。

## 重要性评级

评级是6分。

理由如下。

模型是智能体的大脑。

前端选模型靠这个模块。

模型授权是权限体系的一部分。

每个对话都要先列模型。

但这个模块逻辑简单。

就是配置的只读投影。

没有它前端可以拿默认模型。

所以评级是6分。
