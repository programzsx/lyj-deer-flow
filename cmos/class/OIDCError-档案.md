# OIDCError档案

源文件：`backend/app/gateway/auth/oidc.py`

## 一、这个类是干什么的

OIDCError是OIDC操作的基类异常。

OIDCError继承自Python内置的Exception。

OIDCError下的三个子类分别表示不同的OIDC失败。

调用方可以用一个`except OIDCError`捕获所有OIDC失败。

## （一）"消息对API响应安全"的含义

这个类的docstring说明消息对API响应安全。

异常消息不会泄露内部细节。

异常消息可以直接返回给客户端。

## 二、类的成员

这个类没有自定义成员。

它只提供异常类型标识。

它的行为全部继承自Exception。

## （一）它的子类

- `OIDCProviderError`：OIDC提供方返回了错误。例如`access_denied`。
- `OIDCValidationError`：ID令牌验证失败。签名、issuer、audience、过期时间、nonce任一失败都属于这一类。
- `OIDCUserInfoMismatch`：UserInfo的sub与ID令牌的sub不一致。这个不一致可能是userinfo注入攻击。

三个子类都没有自定义成员。

三个子类都只提供类型区分。

## 三、它和谁协作

OIDCService在几乎所有操作失败时抛出这个异常族。

发现文档获取失败抛OIDCError。

令牌交换失败抛OIDCError。

ID令牌验证失败抛OIDCValidationError。

sub不匹配抛OIDCUserInfoMismatch。

认证路由捕获这个异常族并转成HTTP错误响应。

`authenticate_callback`里userinfo获取失败会被捕获。
>
捕获后只记警告日志。
>
流程继续用ID令牌的信息。

这是userinfo的降级策略。

## 四、重要性评级

评级：2分。

理由：这个类是纯粹的异常类型定义。它自己不执行任何逻辑。它的价值是给OIDC失败一个统一的捕获边界和安全的消息约定。排查OIDC问题时靠它的子类区分失败原因。但作为代码，它的复杂度几乎为零。
