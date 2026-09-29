# deerflow.config.auth_config-档案

## 一、这个模块是干什么的

这个模块定义认证配置模型。

认证回答"你是谁"这个问题。

这个模块支持两种认证方式。

一种是OIDC单点登录，对接Keycloak、Google、Azure AD等身份提供者。

一种是内置的邮箱密码认证。

配置写在`config.yaml`的`auth:`下。

## 二、模块里的主要成员

### 1、OIDCProviderConfig类

这个类是一台OIDC身份提供者的配置。

`display_name`是登录按钮上的名字。

`issuer`、`client_id`、`client_secret`是标准OIDC三件套。

`client_secret`支持`$ENV_VAR`引用。

`scopes`是请求的OIDC范围，必须包含openid。

`token_endpoint_auth_method`选择令牌端点的认证方式。

用户开通策略有四个字段。

`auto_create_users`决定首次SSO登录是否自动建用户。

`require_verified_email`要求邮箱已验证。

`allowed_email_domains`限定邮箱域名白名单。

`admin_emails`里的邮箱自动获得管理员角色。

安全方面有`pkce_enabled`和`nonce_enabled`，默认都开启。

非标准发现的提供者可以覆盖各个端点URL。

### 2、OIDCAuthConfig类

这个类是OIDC的总配置。

`enabled`是开关，默认关闭。

`providers`是提供者ID到配置的映射。

`frontend_base_url`服务于反向代理后面的回调。

### 3、LocalAuthConfig类

这个类是内置邮箱密码认证的配置。

`allow_registration`决定是否允许自助注册。

纯SSO开通账号的部署应设为false。

原因是本地注册不经过OIDC的开通策略。

`max_login_attempts`是一个IP允许的失败登录次数，默认5次。

下限是2次。

原因是单次失败就锁IP会让一个拼写错误锁掉共享出口IP后面的所有人。

计数器是每网关进程的。

多进程部署里有效次数会随进程数放大。

`lockout_seconds`是锁定时长，默认300秒。

### 4、AuthAppConfig类

这个类是`auth:`配置节的总模型。

`oidc`和`local`两个字段，各有默认工厂。

## 三、它和谁协作

`app_config.py`的`auth`字段是这份配置。

网关的认证路由消费OIDC提供者配置。

登录限流逻辑消费`LocalAuthConfig`。

## 四、重要性评级

评级：7分。

理由：认证是生产部署的必需能力。PKCE、nonce、邮箱验证这些安全默认值很关键。但模块本身是纯数据模型，逻辑相对简单直接。
