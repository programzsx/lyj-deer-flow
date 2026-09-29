# app.gateway.routers.capabilities-档案

源码路径是backend/app/gateway/routers/capabilities.py。

## 一、这个模块是干什么的

capabilities.py是能力发现路由。

能力指可安装的插件和集成。

这个模块让前端知道有哪些能力可以装。

已装的能力有哪些。

这个模块很小，只有51行。

真正的逻辑在app.gateway.capabilities里。

## 二、模块里的主要成员

路由前缀是/api/capabilities。

### 1、端点列表

- GET "/catalog"返回能力目录。
- GET "/installations/{adapter}"返回已安装列表。
- POST "/installations"安装能力。

### 2、委托模式

catalog直接返回PluginManifest列表。

installations和install委托给app.gateway.capabilities的适配器。

适配器复用integrations、mcp、skills这些现有服务。

适配器不复制凭据和配置存储。

能力发现对认证用户公开。

变更操作复用既有授权策略。

## 三、它和谁协作

上游是前端的能力市场页面。

下游是app.gateway.capabilities适配层。

适配层再调deerflow.capabilities和各集成服务。

依赖注入走app.gateway.deps。

## 重要性评级

评级是5分。

理由如下。

能力发现是新功能入口。

这个模块本身很小。

主要逻辑都在capabilities适配层和下游服务里。

没有这个模块，用户失去统一的能力市场入口。

用户仍可以分别用integrations、mcp、skills接口。

核心运行路径完全不依赖它。

所以评级是5分。
