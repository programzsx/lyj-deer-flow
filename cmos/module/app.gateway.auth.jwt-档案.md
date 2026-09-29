# app.gateway.auth.jwt 档案

## 一、这个模块是干什么的

这个模块负责JWT令牌的创建和校验。

用户登录成功后。系统要发一个JWT令牌。后续请求带着这个令牌。系统靠这个令牌识别用户。

这个模块负责两件事。第一件事是签发令牌。第二件事是校验令牌。

校验失败时。这个模块返回具体失败原因。失败原因有三种。过期、签名无效、格式损坏。

## 二、模块里的主要成员

### 1、TokenPayload类

这是一个pydantic模型。这个类描述JWT令牌的载荷。

- sub：用户ID。这是令牌的主体。
- exp：过期时间。
- iat：签发时间。可以为空。
- ver：令牌版本。默认0。这个版本号必须和User.token_version一致。

令牌版本号用于令牌失效。用户改密码时版本号加一。旧令牌的版本号对不上。旧令牌就失效了。

### 2、create_access_token函数

这个函数负责签发令牌。

函数签名是create_access_token(user_id, expires_delta=None, token_version=0)。

处理流程如下。

- 调get_auth_config拿配置。
- 过期时间用传入的expires_delta。没传就用配置的token_expiry_days。默认7天。
- 取当前UTC时间。
- 拼出载荷。载荷包含sub、exp、iat、ver四个字段。
- 用HS256算法加密。密钥来自配置的jwt_secret。
- 返回编码后的JWT字符串。

### 3、decode_token函数

这个函数负责校验令牌。

函数签名是decode_token(token)。返回值是TokenPayload或TokenError。

处理流程如下。

- 调get_auth_config拿配置。
- 用HS256算法和jwt_secret解码。
- 解码成功就构建TokenPayload返回。
- 过期就返回TokenError.EXPIRED。
- 签名无效就返回TokenError.INVALID_SIGNATURE。
- 其他PyJWT错误返回TokenError.MALFORMED。

注意这个函数不抛异常。校验失败返回具体的TokenError。调用方按返回值分支处理。

## 三、它和谁协作

### 1、它依赖谁

- app.gateway.auth.config.get_auth_config：提供签名密钥和过期天数。
- app.gateway.auth.errors.TokenError：承载解码失败原因。
- pyjwt：提供encode和decode。

### 2、谁调用它

登录流程调create_access_token签发令牌。会话cookie模块把令牌放进cookie。认证中间件调decode_token校验每个请求的令牌。个人访问令牌PAT模块也依赖JWT体系。

## 四、重要性评级

评级是8分。

理由如下。

JWT是认证体系的核心机制。每个已认证请求都要经过decode_token校验。登录流程都要经过create_access_token签发。

令牌版本号机制也在这个模块。这个机制支持改密码后使旧令牌失效。这是安全必需的能力。

这个模块是纯函数式的。逻辑清晰。没有副作用。但是它不是配置和错误的顶层组织者。它只是签发和校验的执行者。所以评级是8分。
