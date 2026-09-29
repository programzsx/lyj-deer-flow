# app.gateway.routers.features-档案

源码路径是backend/app/gateway/routers/features.py。

## 一、这个模块是干什么的

features.py是只读的功能开关端点。

前端启动时需要知道后端开了哪些功能。

知道开关后前端可以裁剪界面。

知道开关后前端不发后端必然拒绝的请求。

配置类开关读get_config，改动config.yaml后下一次请求就生效。

启动期开关报告实际启动的运行时。

这个模块只有123行。

## 二、模块里的主要成员

路由前缀是/api。

### 1、端点列表

- GET "/features"返回FeaturesResponse。

### 2、开关内容

响应里包含浏览器工具开关。

响应里包含知识范围选择开关。

_response里包含上下文用量显示开关。

_knowledge_scope_selection_enabled计算知识范围开关。

## 三、它和谁协作

上游是前端启动引导逻辑。

下游是deerflow.config.app_config的AppConfig。

AppConfig支持基于mtime的热加载。

这个模块不依赖数据库。

## 重要性评级

评级是4分。

理由如下。

功能开关是前后端协作的润滑剂。

没有它，前端要么猜测功能，要么硬编码开关。

但这个模块只有一个只读端点。

逻辑简单，体量小。

它不承载任何业务数据。

核心功能不经过它。

所以评级是4分。
