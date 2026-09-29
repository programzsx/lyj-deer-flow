# app.gateway.auth.config 档案

## 一、这个模块是干什么的

这个模块负责认证相关的配置。

认证系统需要一个JWT签名密钥。这个模块负责找到这个密钥。

这个模块还会加载GitHub OAuth的客户端ID和客户端密钥。

这个模块还会加载令牌过期天数的配置。

这些配置在启动时解析一次。解析完成后就缓存在内存里。后续调用直接拿缓存。

这个模块还有一个兜底能力。如果环境变量里没有配置密钥，这个模块会自动生成一个新密钥。这个模块会把新密钥写到`.jwt_secret`文件里。下次重启时直接读这个文件。这样会话在重启后依然有效。

## 二、模块里的主要成员

### 1、AuthConfig类

这是一个pydantic模型。

这个类承载三个配置项。

- jwt_secret：JWT签名密钥。这个字段是必填项。
- token_expiry_days：令牌过期天数。默认7天。最小1天。最大30天。
- oauth_github_client_id：GitHub OAuth客户端ID。可以为空。
- oauth_github_client_secret：GitHub OAuth客户端密钥。可以为空。

类注释说明了一件事。users表现在放在共享的持久化数据库里。数据库由deerflow.persistence.engine管理。旧的users_db_path配置键已经删除。用户存储和其他表一样通过config.database配置。

### 2、_load_or_create_secret函数

这个函数负责密钥的持久化。

这个函数先算出密钥文件路径。路径是base_dir下的`.jwt_secret`。base_dir来自deerflow.config.paths的get_paths()。

这个函数的处理顺序如下。

- 文件存在。函数读取文件内容。内容非空就返回这个密钥。
- 读取失败。函数抛出RuntimeError。错误信息提示用户显式设置AUTH_JWT_SECRET，或者修复目录权限。
- 文件不存在。函数用secrets.token_urlsafe(32)生成新密钥。
- 函数用os.open创建文件。权限设为0o600。只有进程用户能读。
- 函数把密钥写进文件。

这个函数保证了密钥是稳定的。没有配置时自动生成一次。之后一直复用。

### 3、get_auth_config函数

这个函数是全局配置的入口。

第一次调用时做这些事。

- 加载.env文件。
- 从环境变量读AUTH_JWT_SECRET。
- 环境变量有值就直接用。
- 环境变量没有值就调_load_or_create_secret生成。
- 生成后把密钥回写进环境变量。
- 同时打一条warning日志。日志提示生产环境应该在.env里配置AUTH_JWT_SECRET。
- 最后构建AuthConfig并缓存。

之后的调用直接返回缓存。配置只解析一次。

### 4、set_auth_config函数

这个函数用于测试。测试可以注入自定义的AuthConfig。

## 三、它和谁协作

### 1、它依赖谁

- deerflow.config.paths.get_paths：提供base_dir，定位`.jwt_secret`文件。
- pydantic：提供BaseModel和Field。
- dotenv：加载.env文件。
- os和secrets：生成密钥和写文件。

### 2、谁调用它

get_auth_config是认证模块的总入口。jwt签发和校验需要jwt_secret。会话cookie模块需要token_expiry_days。GitHub OAuth登录需要oauth配置。这些调用方都通过get_auth_config拿配置。

## 四、重要性评级

评级是9分。

理由如下。

JWT密钥是整个认证体系的根。所有令牌的签发和校验都依赖这个密钥。这个模块保证了密钥的稳定。密钥不稳定会导致重启后所有会话失效。这个模块还处理了密钥的安全落盘。文件权限是0o600。缺少这个模块，认证系统无法启动。所以这个模块的评级是9分。
