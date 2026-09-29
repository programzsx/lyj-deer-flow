# TokenPayload档案

源文件：`backend/app/gateway/auth/jwt.py`

## 一、这个类是干什么的

TokenPayload是JWT令牌的载荷模型。

TokenPayload基于Pydantic的BaseModel。

JWT令牌分两部分。
>
签名部分保证令牌不被篡改。
>
载荷部分携带用户的身份信息。

TokenPayload就是载荷部分的结构定义。

令牌验证通过后，载荷被解析成这个对象。

后续代码从这个对象拿用户ID和版本号。

## 二、类的成员

### 1、字段

- `sub`：用户ID。这是JWT标准声明，表示令牌属于哪个用户。值是用户的UUID字符串。
- `exp`：过期时间。这是JWT标准声明。超过这个时间令牌失效。
- `iat`：签发时间。可选。这是JWT标准声明，表示令牌是什么时候签发的。
- `ver`：令牌版本号。默认0。这个版本号必须与`User.token_version`匹配。

### 2、方法

这个类没有自定义方法。

它是纯数据模型。

令牌的创建和验证由模块级函数完成。

- `create_access_token(user_id, expires_delta, token_version)`：创建JWT访问令牌。用HS256算法和AuthConfig的`jwt_secret`签名。默认有效期7天，由`token_expiry_days`决定。
- `decode_token(token)`：解码并验证JWT令牌。验证通过返回TokenPayload。验证失败返回TokenError变体，不抛异常。

### 3、ver字段的意义

ver字段是实现令牌失效的关键。

用户改密码时，`User.token_version`递增。

旧令牌里的ver是旧值。
>
旧值与新版本号不匹配。
>
旧令牌被拒绝。
>
所有已签发的旧令牌立即失效。

没有这个字段，改密码后旧令牌还能用到过期。

## 三、它和谁协作

`jwt.py`的`create_access_token`构造这个结构并签名。

`jwt.py`的`decode_token`验证令牌后还原成这个对象。

`errors.py`的TokenError枚举是decode_token的失败结果。

AuthConfig提供签名密钥和默认有效期。

`User`模型的`token_version`与它的`ver`字段匹配。

认证中间件解析它拿到用户ID。

## 四、重要性评级

评级：6分。

理由：这个模型定义了会话令牌携带的全部身份信息。每个认证请求都要解析它。ver字段的设计直接决定改密码后能否立即踢掉旧会话。这是安全相关的关键机制。但它是纯数据模型，逻辑在模块函数里。
