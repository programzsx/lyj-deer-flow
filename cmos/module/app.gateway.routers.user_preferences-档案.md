# app.gateway.routers.user_preferences-档案

源码路径是backend/app/gateway/routers/user_preferences.py。

## 一、这个模块是干什么的

user_preferences.py是用户偏好路由。

偏好是界面设置。

例如主题、语言、面板布局。

偏好按用户隔离存储。

这个模块只有64行。

## 二、模块里的主要成员

路由前缀是/api/v1/auth/preferences。

### 1、端点列表

- GET ""读取当前用户偏好。
- PATCH ""部分更新偏好。

### 2、数据模型

Preferences是偏好的响应模型。

PATCH支持部分更新。

部分更新只改传入的字段。

### 3、会话认证

端点要求会话认证。

get_current_user_from_request解析用户。

偏好数据存在数据库的会话表里。

存储走deerflow.persistence.engine的会话工厂。

## 三、它和谁协作

上游是前端设置逻辑。

下游是deerflow.persistence.engine的数据库会话。

认证走app.gateway.deps。

会话来源标记来自app.gateway.auth_disabled。

## 重要性评级

评级是3分。

理由如下。

用户偏好是体验层面的功能。

它不影响任何业务逻辑。

没有它，前端可以用localStorage存偏好。

这个模块让偏好跨设备同步。

模块体量很小，只有两个端点。

逻辑就是读和部分更新。

所以评级是3分。
