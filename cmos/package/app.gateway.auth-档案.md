# app.gateway.auth包档案

源码路径是backend/app/gateway/auth/__init__.py。

## 一、这个包是干什么的

app.gateway.auth包是网关的认证模块。

这个包回答一个问题。

这个问题是"你是谁"。

用户要访问Gateway的API。

API要先确认用户的身份。

认证方式有几种。

第一种是本地邮箱密码登录。

第二种是OIDC单点登录。

第三种是个人访问令牌。

认证成功后Gateway签发JWT令牌。

浏览器把JWT放在HttpOnly会话cookie里。

后续请求凭这个cookie识别用户。

## 二、包里的主要成员

### 1、config.py

config.py定义AuthConfig。

AuthConfig包含jwt_secret、token_expiry_days、OAuth GitHub客户端配置。

jwt_secret必须通过AUTH_JWT_SECRET设置。

没有设置时从{base_dir}/.jwt_secret文件加载。

文件不存在时生成新密钥并持久化。

文件权限是0600。

get_auth_config和set_auth_config管理全局单例。

### 2、jwt.py

jwt.py负责JWT令牌的创建和验证。

TokenPayload是令牌载荷。

载荷包含sub（用户ID）、exp（过期时间）、iat（签发时间）、ver（令牌版本）。

create_access_token用HS256算法签名。

decode_token验证令牌。

令牌版本必须匹配User.token_version。

改密码会递增版本号，旧JWT自动失效。

### 3、models.py

models.py定义User和UserResponse模型。

User包含id、email、password_hash、system_role、OAuth关联字段、token_version。

UserResponse是对外的用户信息响应。

### 4、providers.py

providers.py定义AuthProvider抽象基类。

AuthProvider有authenticate和get_user两个抽象方法。

实现这个接口可以扩展新的认证方式。

### 5、local_provider.py

local_provider.py实现LocalAuthProvider。

LocalAuthProvider是邮箱密码认证提供者。

LocalAuthProvider依赖UserRepository查用户。

LocalAuthProvider调用password模块验证密码。

### 6、password.py

password.py是密码哈希工具。

哈希格式是$dfv<N>$<bcrypt哈希>。

v1是旧版，直接bcrypt，有72字节截断问题。

v2是当前版，先用SHA-256预哈希再bcrypt，避免截断。

验证时自动识别版本。

旧部署在下次登录时透明升级。

### 7、repositories子包

repositories子包是用户存储接口和SQLAlchemy实现。

详情见app.gateway.auth.repositories包档案。

### 8、session_cookie.py和session_cookie_state.py

session_cookie.py定义会话cookie策略。

cookie名是access_token。

策略只在HTTPS、可信转发HTTPS、localhost HTTP或显式配置时持久化cookie。

公共HTTP沙箱URL降级为会话cookie。

session_cookie_state.py定义cookie签发的状态属性。

### 9、pat.py

pat.py实现个人访问令牌。

令牌格式是dfp_加base62编码的32个CSPRNG字节。

令牌只在创建响应里显示一次。

数据库只存SHA-256摘要。

验证是摘要索引查找加常数时间比较。

v1作用域是authz拥有的路由权限字符串。

PAT只能收窄owning用户的权限，不能扩大。

### 10、oidc.py和oidc_state.py

oidc.py是OIDC认证服务。

服务提供发现、授权URL生成、令牌交换、ID令牌验证、userinfo获取。

元数据和JWKS缓存5分钟。

oidc_state.py处理OIDC状态。

### 11、user_provisioning.py

user_provisioning.py处理OIDC登录的用户供给。

已有用户直接用。

新用户自动创建。

可以限制邮箱域名。

已有的本地账号绝不自动关联OIDC身份。

邮箱冲突阻止SSO登录并返回409。

这样SSO登录永远抢不走本地密码账号。

### 12、errors.py

errors.py定义AuthErrorCode枚举和TokenError枚举。

AuthErrorResponse是结构化错误载荷，替代裸的detail字符串。

### 13、reset_admin.py和credential_file.py

reset_admin.py是重置管理员密码的CLI工具。

用法是python -m app.gateway.auth.reset_admin。

credential_file.py把初始管理员凭证写到0600的受限文件。

这样CI和日志聚合器永远看不到明文密钥。

## 三、它和谁协作

下游是routers/auth.py。

auth.py路由是HTTP端点，调用本包完成登录、注册、登出、改密码、PAT管理、OIDC回调。

下游还有auth_middleware.py。

认证中间件用decode_token验证每个请求的JWT。

下游还有deps.py。

deps.py的get_current_user从认证上下文取用户。

本包依赖deerflow.persistence的共享数据库。

users表和threads_meta、runs等表在同一个数据库。

## 重要性评级

评级是8分。

理由如下。

认证是所有API的安全前提。

没有认证模块，Gateway就只能是auth_disabled的裸奔模式。

JWT签发、会话cookie、PAT、OIDC四条认证路径都在这个包里。

routers/auth.py的1100多行端点代码全部依赖本包。

删除这个包等于删除全部登录能力。

任何部署都需要重新实现认证。

所以评级是8分。

不评更高分的原因是auth-disabled的本地模式可以绕过认证。

核心智能体运行时本身不依赖这个包。
