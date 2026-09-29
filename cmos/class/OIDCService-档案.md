# OIDCService档案

源文件：`backend/app/gateway/auth/oidc.py`

## 一、这个类是干什么的

OIDCService是OIDC认证的服务类。

OIDCService提供与具体提供方无关的OIDC操作。

OIDC是OpenID Connect的缩写。OIDC是单点登录协议。

OIDCService覆盖OIDC回调的全部环节。
>
发现文档获取。
>
授权URL生成。
>
授权码换令牌。
>
ID令牌验证。
>
userinfo获取。

这五个环节合起来就是一次完整的OIDC登录。

 deer-flow支持keycloak、google等OIDC提供方，靠的就是这个类。

## （一）缓存设计

OIDCService用进程内缓存保存元数据和JWKS。

元数据缓存TTL是300秒。

JWKS缓存TTL是300秒。

缓存按提供方的`issuer`做键。

不同提供方的缓存条目互相隔离。

TTL可以通过构造参数调整。

## 二、类的成员

### 1、字段

- `_metadata_cache`：发现元数据的进程内缓存。键是issuer。值是（时间戳，数据）元组。
- `_jwks_cache`：JWKS公钥集的进程内缓存。键是jwks_uri。
- `_metadata_ttl`和`_jwks_ttl`：两个缓存的TTL。
- `_http`：httpx异步客户端。超时15秒。

### 2、方法

- `__init__`：初始化缓存和HTTP客户端。
- `close()`：关闭底层HTTP客户端。
- `discover(issuer, overrides)`：获取并缓存发现元数据。`overrides`可以覆盖发现结果里的端点地址。会校验发现文档的issuer与配置的issuer一致，防止被篡改的发现文档引导伪造。
- `build_authorization_url(...)`：构造授权URL。参数包括client_id、redirect_uri、scopes、state、nonce、code_challenge。支持PKCE的S256方法。返回浏览器要重定向的URL。
- `exchange_code(...)`：在令牌端点用授权码换令牌。支持`client_secret_basic`和`client_secret_post`两种认证方式。
- `_load_jwks(jwks_uri, force_refresh)`：加载并缓存JWKS。`force_refresh=True`用于kid未命中时强制刷新，支持密钥轮换。
- `_resolve_signing_key(...)`：在JWKS里找匹配kid的签名密钥。跳过无效的JWK条目并记警告。单个坏条目不会让验证崩溃。
- `validate_id_token(...)`：验证ID令牌并返回claims。验证签名（通过JWKS）、issuer、audience、过期时间、issued-at、nonce。算法白名单只允许RS256、RS384、RS512、ES256、ES384、ES512。nonce比较使用常数时间比较。
- `fetch_userinfo(metadata, access_token, expected_sub)`：从userinfo端点获取用户信息。校验userinfo的sub与ID令牌的sub一致。这个校验防止userinfo注入攻击。
- `authenticate_callback(...)`：编排完整的OIDC回调。按顺序执行令牌交换、ID令牌验证、userinfo获取。userinfo获取失败只记警告并继续用ID令牌。最终返回规范化的`OIDCIdentity`。

## 三、它和谁协作

`OIDCMetadata`是discover的产出物，也是其他方法的输入。

`OIDCIdentity`是`authenticate_callback`的产出物。

`OIDCError`异常族是它的失败信号。

`OIDCStatePayload`记录的state、nonce、code_verifier会传给它使用。

认证路由驱动它完成回调流程。

它通过httpx与OIDC提供方通信。

用户查找和创建在路由层通过`LocalAuthProvider`完成。

## 四、重要性评级

评级：9分。

理由：OIDCService是OIDC认证的核心。单点登录的每一步都由它执行。它内置了大量安全设计：issuer固定校验防发现文档篡改、算法白名单防算法降级、kid未命中刷新支持密钥轮换、常数时间比较防时序攻击、sub校验防userinfo注入。这些设计直接决定SSO登录的安全性。回调编排把五个环节串成一个原子流程。没有这个类，OIDC登录完全无法工作。它只比9分低一点，因为令牌签发和会话管理不在它手里。
