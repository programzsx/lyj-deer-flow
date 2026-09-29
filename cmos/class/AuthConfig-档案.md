# AuthConfig档案

源文件：`backend/app/gateway/auth/config.py`

## 一、这个类是干什么的

AuthConfig是认证模块的配置类。

AuthConfig基于Pydantic的BaseModel。

AuthConfig保存JWT签名密钥和令牌有效期。

AuthConfig在网关启动时被解析一次。

AuthConfig解析后作为全局单例存在。

整个认证模块都从这个类读取配置。

## （一）它解决了什么问题

JWT令牌需要密钥才能签名和验证。

密钥必须稳定。
>
密钥不稳定会导致重启后所有会话失效。

AuthConfig负责保证密钥的稳定获取。

用户可以显式通过`AUTH_JWT_SECRET`环境变量设置密钥。

用户不设置时，AuthConfig会自动生成一个密钥。

自动生成的密钥会持久化到`{base_dir}/.jwt_secret`文件。

持久化保证会话在重启后依然有效。

## （二）旧配置键的移除

旧的`users_db_path`配置键已被移除。

users表现在由`deerflow.persistence.engine`管理的共享持久化数据库承载。

用户存储的配置统一走`config.database`。

## 二、类的成员

### 1、字段

- `jwt_secret`：JWT签名的密钥。这个字段是必填字段。必须通过`AUTH_JWT_SECRET`设置。
- `token_expiry_days`：令牌有效天数。默认7天。取值范围是1到30。
- `oauth_github_client_id`：GitHub OAuth的客户端ID。可选。
- `oauth_github_client_secret`：GitHub OAuth的客户端密钥。可选。

### 2、模块级函数（与这个类协作）

- `get_auth_config()`：获取全局AuthConfig实例。首次调用时从环境变量解析。环境变量没有密钥时，调用`_load_or_create_secret()`生成并持久化密钥。生成时记录警告日志。
- `set_auth_config(config)`：设置全局AuthConfig实例。这个函数供测试使用。
- `_load_or_create_secret()`：从`.jwt_secret`文件加载密钥。文件不存在时生成新密钥并用0o600权限写入。读写失败时抛出RuntimeError。错误信息提示用户显式设置`AUTH_JWT_SECRET`或修复目录权限。

## 三、它和谁协作

AuthConfig被`get_auth_config()`创建和管理。

`get_auth_config()`调用`_load_or_create_secret()`获取密钥。

`_load_or_create_secret()`调用`deerflow.config.paths.get_paths()`定位基础目录。

`jwt.py`的`create_access_token`和`decode_token`读取`jwt_secret`来签名和验证令牌。

`session_cookie.py`读取`token_expiry_days`来计算会话cookie的有效期。

`oidc_state.py`读取`jwt_secret`来签名OIDC状态cookie。

## 四、重要性评级

评级：6分。

理由：所有JWT签名和验证都依赖这个类的`jwt_secret`字段。`token_expiry_days`决定会话寿命。密钥持久化逻辑直接影响重启后会话是否存活。这个类是配置中枢，缺了它认证模块无法工作。但这个类本身逻辑不复杂，主要是字段定义和加载，所以不给高分。
