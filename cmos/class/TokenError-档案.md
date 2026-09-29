# TokenError档案

源文件：`backend/app/gateway/auth/errors.py`

## 一、这个类是干什么的

TokenError是JWT解码失败的枚举。

TokenError继承自StrEnum。

TokenError穷举了JWT解码失败的所有原因。

`decode_token`验证令牌失败时不抛异常。

`decode_token`返回一个TokenError变体。

调用方按变体判断失败原因。

## （一）它的枚举值

- `EXPIRED`：令牌过期。对应值`expired`。
- `INVALID_SIGNATURE`：签名无效。对应值`invalid_signature`。签名无效可能是令牌被篡改，也可能是密钥不匹配。
- `MALFORMED`：令牌格式错误。对应值`malformed`。令牌结构损坏或不是合法的JWT。

## （二）为什么用返回值而不是异常

JWT验证失败是常态分支。

浏览器每次请求都带令牌。
>
令牌过期是经常发生的事。
>
过期不是 exceptional 的情况。

用返回值表示失败避免了异常开销。

调用方写`if isinstance(result, TokenError)`比try/except更直白。

## 二、类的成员

这个类只有三个枚举成员，没有方法和字段。

## 三、它和谁协作

`jwt.py`的`decode_token`函数产出这个枚举的值。

`errors.py`的`token_error_to_code`函数把这个枚举映射到AuthErrorCode。

`TokenError.EXPIRED`映射到`AuthErrorCode.TOKEN_EXPIRED`。

其余的都映射到`AuthErrorCode.TOKEN_INVALID`。

认证中间件用这个枚举判断令牌的状态。

## 四、重要性评级

评级：2分。

理由：这个类只有三个枚举值。它自己不执行任何逻辑。它的价值是给JWT失败一个精确的词汇表。令牌过期的提示信息依赖它。但作为代码，它的复杂度几乎为零。
