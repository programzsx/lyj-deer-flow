# app.gateway.routers.auth-档案

源码路径是backend/app/gateway/routers/auth.py。

## 一、这个模块是干什么的

auth.py是认证HTTP端点。

认证回答一个问题。

这个问题是你是谁。

这个模块管登录、注册、登出、改密码。

这个模块还管个人访问令牌和OIDC登录。

用户在登录页面做的所有操作，都调用这个模块。

这个模块有1100多行，是路由里第二大的文件。

## 二、模块里的主要成员

路由前缀是/api/v1/auth。

### 1、本地认证端点

- POST "/login/local"本地账号密码登录。
- POST "/register"注册新用户。
- POST "/logout"登出。
- POST "/change-password"修改密码。
- GET "/me"读取当前用户信息。
- GET "/setup-status"查询是否需要初始化。
- POST "/initialize"初始化管理员。

登录成功会设置会话cookie。

注册受_registration_enabled开关控制。

### 2、登录节流

登录有节流策略。

按IP记录失败次数。

失败超过上限就锁定一段时间。

_trusted_proxies识别可信代理头。

这防止伪造IP绕过节流。

### 3、密码强度

密码有强度校验。

_validate_strong_password检查长度和字符种类。

_password_is_common拒绝常见弱密码。

### 4、PAT管理

- POST "/pats"创建个人访问令牌。
- GET "/pats"列出令牌。
- DELETE "/pats/{pat_id}"吊销令牌。

PAT端点要求会话来源。

这防止用PAT再创建PAT。

### 5、OIDC登录

- GET "/providers"列出认证提供方。
- GET "/oauth/{provider}"发起OIDC登录。
- GET "/callback/{provider}"处理OIDC回调。

回调完成用户供应和会话建立。

## 三、它和谁协作

上游是前端登录和注册页面。

下游是app.gateway.auth子包。

auth子包提供JWT、会话cookie、OIDC服务、用户仓库。

auth_middleware消费这个模块设置的会话cookie。

CSRF中间件保护这个模块的写端点。

## 重要性评级

评级是9分。

理由如下。

认证是系统的第一道门。

没有认证就没有用户隔离。

没有用户隔离，多用户数据会互相泄露。

登录节流和密码强度直接影响安全。

PAT和OIDC支撑脚本和企业的接入方式。

但本地开发可以关闭认证。

认证关闭时系统仍能运行。

所以评级是9分。
