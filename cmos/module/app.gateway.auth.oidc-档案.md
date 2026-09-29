# app.gateway.auth.oidc 档案

## 一、这个模块是干什么的

这个模块是OIDC登录服务。

OIDC的全称是OpenID Connect。OIDC是一种标准登录协议。用户可以通过外部身份提供者登录系统。例如通过Keycloak或Google登录。

这个模块的文件位置是`backend/app/gateway/auth/oidc.py`。

这个模块做的是"提供者无关"的OIDC操作。意思是这个模块不绑定某个具体的身份提供者。任何符合OIDC标准的提供者都能用。

这个模块负责五件事。

第一件事是发现。自动获取提供者的元数据。

第二件事是生成授权URL。让浏览器跳转到提供者的登录页。

第三件事是令牌交换。用授权码换取令牌。

第四件事是验证ID token。确认令牌是真提供者发的、没被篡改、没过期。

第五件事是获取userinfo。从提供者拉取用户的邮箱和姓名。

这个模块的核心类叫`OIDCService`。

## 二、模块里的主要成员

### 1、OIDCMetadata数据类

这个类保存发现阶段拿到的提供者元数据。

这个类是冻结的dataclass。创建后不能修改。

这个类有五个字段。`issuer`是提供者标识。`authorization_endpoint`是授权端点。`token_endpoint`是令牌端点。`userinfo_endpoint`是用户信息端点。`jwks_uri`是公钥集合的地址。

### 2、OIDCIdentity数据类

这个类保存归一化后的用户身份。

这个类也是冻结的dataclass。

这个类有六个字段。`provider`是提供者ID。`subject`是用户的唯一标识。`email`是邮箱。`email_verified`标记邮箱是否已验证。`name`是姓名。`claims`是完整的声明集合。

### 3、四个异常类

`OIDCError`是基础异常。异常消息可以安全地返回给API调用方。

`OIDCProviderError`表示提供者返回了错误。例如用户拒绝了授权。

`OIDCValidationError`表示ID token验证失败。

`OIDCUserInfoMismatch`表示userinfo的`sub`和ID token的`sub`对不上。

### 4、OIDCService类

这个类是模块的核心。

这个类内部有两个缓存。一个缓存提供者元数据。一个缓存JWKS公钥。缓存的键是提供者的`issuer`。不同提供者有各自的缓存条目。缓存有效期默认是5分钟。

这个类还持有一个`httpx.AsyncClient`。超时是15秒。`close`方法负责关闭这个客户端。

### 5、discover方法

这个方法负责发现。

这个方法拼接标准的发现路径`/.well-known/openid-configuration`。然后向提供者请求元数据。

这个方法先查缓存。缓存没过期就直接返回。

这个方法有一个重要的安全校验。发现文档里的`issuer`必须和配置的`issuer`一致。不一致就抛异常。这是遵循RFC 8414第4节。校验的目的是防止被篡改的发现文档把接受的`iss`值引导到攻击者选定的值。这会扩大ID token伪造的攻击面。

`overrides`参数可以覆盖发现到的端点地址。这是为非标准端点的提供者准备的。

### 6、build_authorization_url方法

这个方法生成授权URL。

这个方法构造标准参数。`response_type`固定为`code`。加上`client_id`、`redirect_uri`、`scope`、`state`。

支持`nonce`参数。支持PKCE的`code_challenge`参数。PKCE的挑战方法固定为`S256`。

返回值是浏览器要跳转的完整URL。

### 7、exchange_code方法

这个方法负责令牌交换。

这个方法向令牌端点发POST请求。请求体里带`grant_type=authorization_code`、授权码、`redirect_uri`、`client_id`。

支持两种客户端认证方式。`client_secret_basic`方式把凭据放在HTTP Basic头里。`client_secret_post`方式把`client_secret`放在请求体里。默认是后者。

PKCE场景下还会带`code_verifier`。

失败时抛`OIDCError`。错误信息里带HTTP状态码和响应体的前200个字符。

### 8、_load_jwks方法

这个方法加载JWKS。JWKS是提供者的公钥集合。

这个方法也走缓存。`force_refresh=True`可以绕过缓存。令牌里的`kid`找不到对应公钥时会强制刷新一次。

### 9、_resolve_signing_key方法

这个方法在JWKS里找到匹配`kid`的签名公钥。

这个方法会跳过无效的JWK条目。跳过时记警告日志。单个坏条目不会让整个验证崩溃。

`kid`指定了且这个坏条目恰好是目标时，快速失败抛`OIDCValidationError`。

### 10、validate_id_token方法

这个方法是安全的核心。

这个方法验证ID token的六个方面。

第一个方面是签名。用JWKS里的公钥验签。

第二个方面是算法白名单。只允许`RS256`、`RS384`、`RS512`、`ES256`、`ES384`、`ES512`。其他算法直接拒绝。这防住了算法混淆攻击。

第三个方面是`issuer`。令牌的签发者必须匹配。

第四个方面是`audience`。令牌的受众必须是本系统的`client_id`。

第五个方面是有效期。`exp`和`iat`都强制校验。`exp`、`iss`、`sub`、`aud`四个声明缺一不可。

第六个方面是`nonce`。如果预期有nonce，令牌里的nonce必须匹配。比较用的是常数时间比较函数`_constant_time_compare`。常数时间比较防住了时序攻击。

找不到匹配`kid`的公钥时，这个方法会强制刷新一次JWKS再找。这是为了支持密钥轮换。刷新后还找不到才报错。

### 11、fetch_userinfo方法

这个方法从userinfo端点拉取用户信息。

这个方法有一个防注入校验。userinfo返回的`sub`必须和ID token的`sub`一致。不一致就抛`OIDCUserInfoMismatch`。这防住了userinfo注入攻击。

### 12、authenticate_callback方法

这个方法是完整回调流程的编排器。

流程是三步。第一步调用`exchange_code`换令牌。第二步调用`validate_id_token`验证ID token。第三步调用`fetch_userinfo`拉取用户信息。

userinfo拉取失败不致命。失败只记警告。继续用ID token里的信息。

userinfo和claims合并。email以userinfo为准。

最后返回归一化的`OIDCIdentity`。

### 13、_constant_time_compare函数

模块级私有函数。

这个函数用`secrets.compare_digest`做常数时间字符串比较。

## 三、它和谁协作

### 1、它依赖谁

它依赖`httpx`库发HTTP请求。

它依赖`PyJWT`库做令牌解码和验签。

它依赖`app.gateway.auth.config`获取认证配置。

它不依赖数据库。它是纯粹的外部协议交互层。

### 2、谁调用它

`app.gateway.routers.auth`调用它。路由层用`OIDCService`完成登录回调。也用`OIDCError`做错误处理。

`app.gateway.auth.user_provisioning`依赖它产出的`OIDCIdentity`。回调归一化出的身份交给开通逻辑。开通逻辑决定查找还是创建用户。

`app.gateway.auth.oidc_state`和它配合。`oidc_state`管理state、nonce、PKCE verifier。这些值最终传给`OIDCService`的各个方法。

## 四、重要性评级

评级：8分。

理由如下。

OIDC登录是系统SSO能力的核心。这个模块是SSO的唯一协议实现。

这个模块的安全设计非常扎实。 issuer固定校验防住了发现文档篡改。算法白名单防住了算法混淆。nonce常数时间比较防住了时序攻击。userinfo的`sub`校验防住了注入攻击。kid未命中时刷新JWKS支持了密钥轮换。

这些安全细节一旦做错，后果是认证被绕过。所以这个模块的正确性极其重要。

这个模块的缓存设计也降低了SSO登录的延迟。元数据和公钥不用每次都重新拉取。

评级不到10分的原因是：OIDC是可选功能。不启用SSO的部署用不到这个模块。而会话cookie和JWT是所有部署都依赖的。

评级不到6分的原因是：删掉这个模块，SSO功能完全不可用。重建这个模块需要非常仔细地复刻这些安全校验。这个模块很难被简单替代。
