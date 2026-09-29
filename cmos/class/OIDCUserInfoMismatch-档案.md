# OIDCUserInfoMismatch档案

源文件：`backend/app/gateway/auth/oidc.py`

## 一、这个类是干什么的

OIDCUserInfoMismatch是userinfo与ID令牌不一致的异常。

OIDCUserInfoMismatch继承自OIDCError。

OIDCUserInfoMismatch表示UserInfo端点返回的sub与ID令牌的sub对不上。

正常的OIDC流程里两者必须一致。

两者不一致说明出了问题。

## （一）为什么这个不一致是安全问题

ID令牌的sub是身份的权威来源。

userinfo端点是另一个信息来源。

攻击者可能操纵userinfo的响应。

攻击者让userinfo返回另一个用户的sub。

这就是userinfo注入攻击。

不校验sub的后果很严重。
>
合并claims时 userinfo 的email可能覆盖ID令牌的email。
>
攻击者可以用别人的身份登录。

所以sub校验是安全必需的。

## 二、类的成员

这个类没有自定义成员。

它只提供异常类型标识。

它的行为全部继承自OIDCError和Exception。

## 三、它和谁协作

OIDCService的`fetch_userinfo`方法在sub不匹配时抛出这个异常。

`authenticate_callback`里userinfo获取被try包裹。
>
这个异常会被捕获。
>
捕获后只记警告日志。
>
流程继续用ID令牌的信息。

认证路由可以用异常类型区分这种攻击尝试。

## 四、重要性评级

评级：2分。

理由：这个类是一个空的异常类型标记。它自己不执行任何逻辑。真正的安全校验在`fetch_userinfo`里。它的价值是给"sub不一致"一个专属类型，让调用方能区分攻击尝试和普通网络错误。
