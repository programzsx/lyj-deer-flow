# app.gateway.auth.oidc_state 档案

## 一、这个模块是干什么的

这个模块管理OIDC登录过程中的临时状态。

这个模块的文件位置是`backend/app/gateway/auth/oidc_state.py`。

OIDC登录要传三类临时数据。

第一类是`state`。state是防CSRF的随机值。

第二类是`nonce`。nonce用于验证ID token。

第三类是`code_verifier`。这是PKCE的验证串。

这三类数据在登录开始时生成。在回调时核对。中间要保存。

这个模块的做法是把三类数据放进一个短期签名cookie。不放服务器端存储。

这个做法有两个好处。

第一个好处是实现无状态。服务器不用记任何登录中间态。

第二个好处是多worker兼容。多个Gateway进程不用共享Redis也能工作。

cookie的有效期是5分钟。cookie用JWT密钥签名。签名防止cookie被篡改。

## 二、模块里的主要成员

### 1、常量

`OIDC_STATE_COOKIE_PREFIX`是cookie名前缀。值是`df_oidc_state_`。完整cookie名是前缀加提供者ID。

`OIDC_STATE_MAX_AGE`是cookie有效期。值是300秒，即5分钟。

`OIDC_STATE_BYTES`是state的随机字节数。值是32。

`OIDC_NONCE_BYTES`是nonce的随机字节数。值是16。

`OIDC_CODE_VERIFIER_BYTES`是PKCE验证串的随机字节数。值是32。

### 2、OIDCStatePayload类

这个类是cookie内部保存的载荷。

这个类是Pydantic模型。

这个类有七个字段。

`provider`是OIDC提供者ID。必须和state cookie匹配。

`state`是加密随机state值。和查询参数做常数时间比较。

`nonce`是可选的OIDC nonce。用于验证ID token的nonce声明。

`code_verifier`是可选的PKCE验证串。令牌交换时发送。

`next_path`是登录成功后的跳转目标。默认是`/workspace`。

`remember_me`标记生成的会话是否持久化。默认是`True`。

`issued_at`是cookie创建的Unix时间戳。用于过期判断。

### 3、_sign_state_payload函数

这个私有函数用JWT密钥给载荷签名。

签名算法是`HS256`。

密钥来自`get_auth_config().jwt_secret`。

### 4、_verify_state_signed函数

这个私有函数验证签名的载荷。

验证流程是三步。第一步用密钥解码JWT。第二步重建`OIDCStatePayload`。第三步检查过期。超过5分钟返回`None`。

任何JWT错误都返回`None`。错误不会抛出去。

### 5、generate_oidc_state函数

这个函数生成加密随机的state字符串。

内部用`secrets.token_urlsafe`。随机源是32字节。

### 6、generate_nonce函数

这个函数生成ID token验证用的nonce。

内部也用`secrets.token_urlsafe`。随机源是16字节。

### 7、generate_code_verifier函数

这个函数生成PKCE验证串。

内部也用`secrets.token_urlsafe`。随机源是32字节。

### 8、compute_code_challenge函数

这个函数从验证串算出S256挑战。

算法是对验证串做SHA256。再做base64url编码。

### 9、_base64url_encode函数

这个私有函数做base64url编码。

编码不带padding。RFC 7636和OIDC要求不带padding。

### 10、set_state_cookie函数

这个函数把签名后的state cookie写到响应上。

cookie的属性是这样的。

`httponly=True`。JavaScript读不到cookie。

`secure`取决于请求是否HTTPS。判断用的是`is_secure_request`。

`samesite=lax`。

`max_age`是5分钟。

`path`限定为`/api/v1/auth/callback/{provider}`。路径限定让cookie只在回调时发送。

### 11、get_state_cookie函数

这个函数读取并验证指定提供者的state cookie。

先按cookie名取值。取不到返回`None`。取到后交给`_verify_state_signed`验证。

### 12、delete_state_cookie函数

这个函数删除state cookie。

删除时的cookie属性和设置时一致。包括`secure`、`samesite`、`path`。属性一致才能正确删除。

## 三、它和谁协作

### 1、它依赖谁

它依赖`app.gateway.auth.config`。获取JWT签名密钥。

它依赖`app.gateway.csrf_middleware`。复用其中的`is_secure_request`函数判断HTTPS。

它依赖`PyJWT`做签名和验证。

它依赖`fastapi`的`Request`和`Response`操作cookie。

### 2、谁调用它

`app.gateway.routers.auth`调用它。OIDC登录路由在登录开始时调用`set_state_cookie`和三个生成函数。在回调时调用`get_state_cookie`核对state、nonce和verifier。核对完成后调用`delete_state_cookie`清理。

这个模块是纯辅助模块。它没有状态。所有函数都是无副作用的工具函数或cookie读写。

## 四、重要性评级

评级：6分。

理由如下。

这个模块是OIDC登录安全链条的必要一环。state防CSRF。nonce防令牌重放。PKCE防授权码拦截。这三道防线的数据都由这个模块生成、签名、保存、核对。

这个模块的签名cookie方案很聪明。方案让OIDC登录在多worker部署下不需要Redis。

cookie的`path`限定和`httponly`属性也减少了攻击面。

评级不到8分的原因是：这个模块只服务于OIDC。密码登录和PAT都不用它。它是可选功能链上的辅助模块。

评级不到4分的原因是：三类临时数据的安全传递离不开这个模块。`next_path`和`remember_me`也由这个载荷携带。删掉它，OIDC登录流程就断了。
