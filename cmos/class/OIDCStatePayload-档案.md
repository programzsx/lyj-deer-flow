# OIDCStatePayload档案

源文件：`backend/app/gateway/auth/oidc_state.py`

## 一、这个类是干什么的

OIDCStatePayload是OIDC状态cookie里存储的载荷。

OIDCStatePayload基于Pydantic的BaseModel。

OIDC登录开始时，网关要记录state、nonce、PKCE verifier。

传统做法是存到服务器端的存储里。

这个模块用签名cookie代替服务器存储。

cookie的载荷结构就是这个类。

## （一）"无状态"的好处

服务器不存状态就没有服务器端会话数据。

没有服务器端会话数据就不需要Redis。

无状态实现与多worker部署兼容。

多worker部署不需要共享存储。

载荷的完整性靠签名保证。
>
签名用的是JWT的HS256算法。
>
签名密钥是AuthConfig的`jwt_secret`。
>
被篡改的cookie无法通过验证。

## 二、类的成员

### 1、字段

- `provider`：OIDC提供方ID。必须与状态cookie的名字匹配。
- `state`：密码学随机的state值。与查询参数比较时使用常数时间比较。
- `nonce`：OIDC nonce。可选。用于验证ID令牌的nonce声明。
- `code_verifier`：PKCE code verifier。可选。令牌交换时发送。
- `next_path`：认证成功后的重定向目标。默认`/workspace`。
- `remember_me`：登录后会话是否持久化。默认True。
- `issued_at`：cookie创建时的Unix时间戳。用于过期判断。

### 2、方法

这个类没有自定义方法。

它是纯数据模型。

签名和验证由模块级函数完成。

- `_sign_state_payload(payload)`：用JWT密钥签名载荷。
- `_verify_state_signed(signed, max_age)`：验证签名并返回载荷。无效或过期返回None。最大有效期300秒。

## 三、它和谁协作

`oidc_state.py`的`set_state_cookie`把它签名后写进cookie。

`get_state_cookie`从cookie读出并验证它。

`generate_oidc_state`、`generate_nonce`、`generate_code_verifier`产出它的字段值。

AuthConfig提供签名密钥。

认证路由在发起OIDC登录时创建它，在回调时验证它。

OIDCService使用它的nonce和code_verifier完成验证和令牌交换。

cookie的path限定为`/api/v1/auth/callback/{provider}`。

cookie是HttpOnly、samesite为lax。

## 四、重要性评级

评级：5分。

理由：这个类是OIDC防CSRF攻击的核心载体。state字段防CSRF，nonce防令牌重放，code_verifier支持PKCE。签名cookie方案让网关在多worker部署下不需要Redis。但它本身是数据结构，签名验证逻辑在模块函数里。
