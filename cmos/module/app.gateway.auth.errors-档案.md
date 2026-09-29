# app.gateway.auth.errors 档案

## 一、这个模块是干什么的

这个模块定义认证模块的错误类型。

认证失败时需要告诉客户端失败的原因。失败原因需要结构化。结构化的原因便于前端识别和处理。

这个模块定义了认证错误的完整清单。这个模块定义了JWT解码失败的完整清单。这个模块还定义了HTTP错误响应的结构。

这个模块还提供一个映射函数。这个函数把JWT解码错误映射成认证错误码。

## 二、模块里的主要成员

### 1、AuthErrorCode枚举

这是一个StrEnum。这个枚举列出所有认证失败条件。

- invalid_credentials：凭据无效。
- token_expired：令牌过期。
- token_invalid：令牌无效。
- user_not_found：用户不存在。
- email_already_exists：邮箱已存在。
- provider_not_found：认证提供方不存在。
- not_authenticated：未认证。
- system_already_initialized：系统已初始化。
- registration_disabled：注册已禁用。

### 2、TokenError枚举

这也是一个StrEnum。这个枚举列出JWT解码失败的原因。

- expired：令牌已过期。
- invalid_signature：签名无效。
- malformed：令牌格式损坏。

### 3、AuthErrorResponse模型

这是一个pydantic模型。这个模型是HTTP错误响应的结构。

- code：错误码。取值来自AuthErrorCode。
- message：人类可读的错误信息。

类注释说明这个模型替代了裸的detail字符串。裸字符串没有结构。前端无法按错误码分支处理。

### 4、token_error_to_code函数

这个函数把TokenError映射成AuthErrorCode。

映射规则如下。

- TokenError.EXPIRED映射到AuthErrorCode.TOKEN_EXPIRED。
- 其他所有TokenError映射到AuthErrorCode.TOKEN_INVALID。

函数注释说这是唯一的事实来源。JWT错误到HTTP错误码的转换只用这一处逻辑。

## 三、它和谁协作

### 1、它依赖谁

- pydantic：提供BaseModel。
- enum.StrEnum：提供字符串枚举。

这个模块不依赖其他auth模块。这个模块是被依赖方。

### 2、谁调用它

jwt模块在解码失败时返回TokenError。jwt模块依赖TokenError枚举。

登录、注册、OAuth等流程用AuthErrorCode标记失败原因。HTTP响应层用AuthErrorResponse包装错误。认证中间件也用这些错误码。

## 四、重要性评级

评级是5分。

理由如下。

这个模块只定义类型。这个模块没有业务逻辑。代码量很小。

但是错误码是契约。所有认证流程的失败路径都引用这些错误码。错误码改名会波及很多调用方。token_error_to_code函数保证映射只有一处。改映射不用到处找。

这个模块被依赖很广。但是自身逻辑简单。所以评级是5分。
