# OIDCValidationError档案

源文件：`backend/app/gateway/auth/oidc.py`

## 一、这个类是干什么的

OIDCValidationError是ID令牌验证失败的异常。

OIDCValidationError继承自OIDCError。

OIDCValidationError表示拿到的ID令牌没有通过验证。

ID令牌是OIDC登录的身份凭证。

身份凭证必须验证通过才能信任。

## （一）哪些验证失败属于这个异常

`validate_id_token`会做多项验证。

- 签名验证。通过JWKS公钥集验证。
- issuer验证。令牌的iss必须等于提供方的issuer。
- audience验证。令牌的aud必须等于本系统的client_id。
- 过期时间验证。令牌不能过期。
- issued-at验证。
- nonce验证。令牌的nonce必须与预期一致。
- 算法白名单验证。只允许RS256、RS384、RS512、ES256、ES384、ES512。
- 必需声明验证。exp、iss、sub、aud必须存在。

以上任何一项失败都抛这个异常。

## 二、类的成员

这个类没有自定义成员。

它只提供异常类型标识。

它的行为全部继承自OIDCError和Exception。

## 三、它和谁协作

OIDCService的`validate_id_token`在验证失败时抛出这个异常。

OIDCService的`_resolve_signing_key`在指定kid的JWK无效时也抛出这个异常。

认证路由捕获后转成HTTP错误响应。

调用方用`except OIDCError`可以同时捕获这个异常和它的兄弟异常。

## 四、重要性评级

评级：2分。

理由：这个类是一个空的异常类型标记。它自己不执行任何逻辑。全部验证逻辑在OIDCService的`validate_id_token`里。它的价值是给"令牌验证失败"一个专属类型。排查SSO登录失败时，这个类型帮助定位问题在令牌验证环节。
