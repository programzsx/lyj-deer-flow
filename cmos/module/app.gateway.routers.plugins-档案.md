# app.gateway.routers.plugins-档案

源码路径是backend/app/gateway/routers/plugins.py。

## 一、这个模块是干什么的

plugins.py是扩展插件路由。

DeerFlow支持部署安装的全栈插件。

插件可以贡献前端模块和HTTP动作。

这个模块让前端发现和调用插件。

这个模块只有146行。

## 二、模块里的主要成员

路由前缀是/api/plugins。

### 1、端点列表

- GET ""列出已安装插件。
- GET "/modules/{module}/{revision}.mjs"返回插件前端模块。
- GET "/{namespace}/assets/{revision}/{path}"返回插件静态资产。
- POST "/{namespace}/actions/{action_name}"调用插件动作。

### 2、模块分发

插件前端模块是ESM文件。

revision防止缓存问题。

模块内容按请求返回。

### 3、动作调用

插件动作是插件注册的HTTP处理器。

invoke_plugin_action转发到插件动作。

动作授权走resolve_plugin_authorization。

授权失败返回403。

_principal从请求解析调用者。

## 三、它和谁协作

上游是插件的前端代码。

下游是harness扩展管理器注册的插件。

授权走app.gateway.authz的插件授权。

插件代码以Gateway权限运行，只应装可信来源。

## 重要性评级

评级是5分。

理由如下。

插件是扩展机制的一部分。

前端模块分发让插件能带界面。

动作调用让插件能带后端逻辑。

但插件是可选的扩展点。

默认部署没有插件。

核心功能不依赖这个模块。

所以评级是5分。
