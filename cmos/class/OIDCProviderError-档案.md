# OIDCProviderError档案

源文件：`backend/app/gateway/auth/oidc.py`

## 一、这个类是干什么的

OIDCProviderError是OIDC提供方返回错误的异常。

OIDCProviderError继承自OIDCError。

OIDCProviderError表示"提供方那边出了错"。

典型例子是用户在提供方的授权页拒绝了授权。

提供方返回`access_denied`。

这时抛的就是这个异常。

## （一）它和其他OIDC异常的区分

OIDCError族有三个具体子类。

OIDCProviderError表示提供方主动报错。

OIDCValidationError表示ID令牌验证失败。

OIDCUserInfoMismatch表示sub不一致。

三者的责任方不同。
>
OIDCProviderError的责任方是提供方或用户操作。
>
OIDCValidationError的责任方是令牌本身。

调用方可以按类型区分处理。

## 二、类的成员

这个类没有自定义成员。

它只提供异常类型标识。

它的行为全部继承自OIDCError和Exception。

## 三、它和谁协作

OIDCService在处理提供方响应出错时抛出这个异常。

认证路由按异常类型决定返回给客户端的错误码。

调用方用`except OIDCError`可以同时捕获这个异常和它的兄弟异常。

## 四、重要性评级

评级：2分。

理由：这个类是一个空的异常类型标记。它自己不执行任何逻辑。它的价值是让调用方区分"提供方出错"和"本地验证出错"。用户拒绝授权是OIDC流程的正常分支，这个类型让这个分支可以被优雅处理。
