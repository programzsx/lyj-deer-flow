# app.gateway.internal_auth-档案

源码路径是backend/app/gateway/internal_auth.py。

## 一、这个模块是干什么的

internal_auth.py是可信内部调用者的认证。

内部调用者是定时任务、渠道服务、MCP任务服务。

这些服务在Gateway进程内部发起运行。

内部调用者不携带用户会话。

这个模块用内部令牌认证它们。

这个模块只有85行。

## 二、模块里的主要成员

### 1、令牌机制

INTERNAL_AUTH_HEADER_NAME是内部令牌头。

头名是X-DeerFlow-Internal-Token。

INTERNAL_AUTH_ENV_VAR是令牌的环境变量。

变量名是DEER_FLOW_INTERNAL_AUTH_TOKEN。

create_internal_auth_headers创建内部认证头。

is_valid_internal_auth_token校验令牌。

### 2、归属头

INTERNAL_OWNER_USER_ID_HEADER_NAME是归属用户头。

头名是X-DeerFlow-Owner-User-Id。

内部调用代真实用户发起运行。

归属头指明运行归谁。

get_trusted_internal_owner_user_id读取归属。

### 3、内部用户

get_internal_user构造内部用户对象。

INTERNAL_SYSTEM_ROLE是内部角色。

角色名是internal。

内部用户身份走SimpleNamespace。

非内部调用者提供的同类头会被丢弃。

客户端不能伪造内部身份。

## 三、它和谁协作

上游是定时任务、渠道服务、MCP任务服务。

这些服务发起内部运行。

下游是app.gateway.services的归属解析。

auth_disabled定义内部认证来源常量。

auth_middleware识别内部头。

## 重要性评级

评级是6分。

理由如下。

内部认证支撑全部后台服务的运行。

定时任务、渠道触发、MCP通知都靠它。

令牌和归属头的设计防伪造。

客户端副本会被丢弃，这是安全关键。

但它是内部机制。

用户不直接感知它。

体量小，逻辑聚焦。

所以评级是6分。
