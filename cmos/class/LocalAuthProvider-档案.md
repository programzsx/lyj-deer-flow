# LocalAuthProvider档案

源文件：`backend/app/gateway/auth/local_provider.py`

## 一、这个类是干什么的

LocalAuthProvider是本地邮箱密码认证的实现类。

LocalAuthProvider继承自AuthProvider抽象基类。

LocalAuthProvider使用本地数据库验证用户身份。

用户提交邮箱和密码。
>
LocalAuthProvider去数据库找用户。
>
LocalAuthProvider验证密码哈希。
>
验证通过就返回User对象。

这就是这个类的核心工作。

## 二、类的成员

### 1、字段

- `_repo`：构造时传入的UserRepository实现。所有的数据库操作都委托给这个仓库。

### 2、方法

- `__init__(repository)`：初始化。接收一个UserRepository实现（SQLite实现）。
- `authenticate(credentials)`：核心认证方法。从`credentials`字典取`email`和`password`。任一缺失返回None。然后按邮箱查用户。用户不存在返回None。用户没有`password_hash`说明是OAuth用户，返回None。密码验证失败返回None。全部通过返回User。
- `get_user(user_id)`：按ID获取用户。直接委托给`_repo.get_user_by_id`。
- `create_user(email, password, system_role, needs_setup)`：创建本地用户。明文密码先做异步哈希。password为None时不设哈希。然后委托仓库插入。
- `create_first_admin(email, password)`：创建第一个管理员账号。已存在管理员时返回None。检查和插入在仓库里是一个原子操作。并发的首次启动请求不能都成功。
- `create_oauth_user(email, oauth_provider, oauth_id, system_role)`：从OAuth/OIDC登录创建新用户。`password_hash`设为None。邮箱是OIDC提供方验证过的邮箱。`oauth_id`是ID令牌的sub声明。
- `get_user_by_oauth(provider, oauth_id)`：按OAuth提供方和ID查用户。委托给仓库。
- `get_user_by_email(email)`：按邮箱查用户。委托给仓库。
- `update_user(user)`：更新用户。委托给仓库。
- `count_users()`：返回注册用户总数。委托给仓库。
- `count_admin_users()`：返回管理员数量。委托给仓库。

### 3、登录时的机会式哈希升级

`authenticate`验证通过后会检查`needs_rehash`。

密码哈希算法升级后，旧哈希需要重算。

重算成功就写回数据库。

重算失败只记警告日志。
>
登录依然成功。
>
临时的数据库错误不能阻止一次有效的登录。

这是故意的降级策略。

## 三、它和谁协作

AuthProvider是它的父类。

UserRepository是它依赖的存储抽象。

SQLiteUserRepository是实际的存储实现。

`User`模型是它的返回类型。

`password.py`模块提供`hash_password_async`、`verify_password_async`、`needs_rehash`三个哈希工具。

认证路由调用它完成登录和用户创建。

OIDC流程通过`create_oauth_user`和`get_user_by_oauth`接入。

## 四、重要性评级

评级：7分。

理由：本地密码登录的每一步都经过这个类。密码验证、用户创建、首个管理员的创建都由它负责。首个管理员的原子创建决定了系统初始化的正确性。机会式哈希升级是安全相关的设计。但大量方法只是对仓库的薄委托，真正的存储逻辑在仓库层。所以给7分而不是更高。
