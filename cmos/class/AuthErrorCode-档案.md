# AuthErrorCode档案

源文件：`backend/app/gateway/auth/errors.py`

## 一、这个类是干什么的

AuthErrorCode是认证模块的错误码枚举。

AuthErrorCode继承自StrEnum。

AuthErrorCode穷举了所有认证失败的情况。

API响应通过这个枚举告诉客户端具体是哪种失败。

## （一）它的枚举值

- `INVALID_CREDENTIALS`：凭据无效。对应值`invalid_credentials`。
- `TOKEN_EXPIRED`：令牌过期。对应值`token_expired`。
- `TOKEN_INVALID`：令牌无效。对应值`token_invalid`。
- `USER_NOT_FOUND`：用户不存在。对应值`user_not_found`。
- `EMAIL_ALREADY_EXISTS`：邮箱已被注册。对应值`email_already_exists`。
- `PROVIDER_NOT_FOUND`：认证提供方不存在。对应值`provider_not_found`。
- `NOT_AUTHENTICATED`：未认证。对应值`not_authenticated`。
- `SYSTEM_ALREADY_INITIALIZED`：系统已初始化。对应值`system_already_initialized`。
- `REGISTRATION_DISABLED`：注册已禁用。对应值`registration_disabled`。

## （二）为什么用StrEnum

StrEnum的成员本身就是字符串。

StrEnum成员可以直接序列化进JSON响应。

不需要额外的转换步骤。

## 二、类的成员

这个类只有枚举成员，没有方法和字段。

模块里还有一个与它协作的函数。

`token_error_to_code(err)`函数把TokenError映射到AuthErrorCode。

`TokenError.EXPIRED`映射到`AuthErrorCode.TOKEN_EXPIRED`。

其余的TokenError都映射到`AuthErrorCode.TOKEN_INVALID`。

这个函数是映射关系的唯一事实来源。

## 三、它和谁协作

AuthErrorCode是AuthErrorResponse的`code`字段的类型。

AuthErrorResponse把这个枚举值发给HTTP客户端。

`token_error_to_code()`函数产出这个枚举的值。

JWT解码失败会经过这个映射，变成HTTP错误码。

## 四、重要性评级

评级：2分。

理由：这个类只是一组字符串常量。它自己不执行任何逻辑。它的价值在于统一错误码词汇，避免散落的字符串字面量。出错时的排查依赖它，但正常流程中它是被动的。
