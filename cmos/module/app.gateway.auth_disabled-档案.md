# app.gateway.auth_disabled-档案

源码路径是backend/app/gateway/auth_disabled.py。

## 一、这个模块是干什么的

auth_disabled.py是认证关闭模式的共享辅助。

本地开发和端到端测试可以关闭认证。

关闭认证后所有请求都落到一个默认用户。

这个模块定义默认用户和认证来源常量。

这个模块还负责在生产环境报警。

这个模块只有58行。

## 二、模块里的主要成员

### 1、常量定义

AUTH_DISABLED_ENV_VAR是开关环境变量。

变量名是DEER_FLOW_AUTH_DISABLED。

AUTH_DISABLED_USER_ID是默认用户ID。

AUTH_DISABLED_USER_EMAIL是默认用户邮箱。

is_auth_disabled检查开关是否打开。

### 2、认证来源

AUTH_SOURCE_SESSION是会话来源。

AUTH_SOURCE_INTERNAL是内部来源。

AUTH_SOURCE_PAT是令牌来源。

AUTH_SOURCE_AUTH_DISABLED是关闭认证来源。

这些常量被全Gateway使用。

请求的认证来源记在request.state上。

### 3、生产报警

_PRODUCTION_ENV_VARS列生产环境变量。

warn_if_auth_disabled_enabled在生产环境打警告。

认证关闭不能带到生产环境。

## 三、它和谁协作

上游是auth_middleware和authz。

这些模块消费认证来源常量。

下游是deerflow.runtime.user_context的默认用户。

PAT和内部认证逻辑也引用这些常量。

## 重要性评级

评级是5分。

理由如下。

认证关闭模式支撑本地开发和测试。

没有它，开发环境也要配完整认证。

认证来源常量被全Gateway引用。

生产报警防止误配置。

但这个模块只是辅助定义。

本身不做认证决策。

生产环境不用这个模式。

所以评级是5分。
