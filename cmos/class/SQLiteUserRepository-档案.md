# SQLiteUserRepository档案

源文件：`backend/app/gateway/auth/repositories/sqlite.py`

## 一、这个类是干什么的

SQLiteUserRepository是UserRepository接口的SQLAlchemy实现。

SQLiteUserRepository继承自UserRepository抽象基类。

SQLiteUserRepository负责users表的全部数据库操作。

users表存在共享的持久化数据库里。

数据库由`deerflow.persistence.engine`管理。

users表与`threads_meta`、`runs`、`run_events`、`feedback`在同一个数据库。

## （一）名字里的"SQLite"

这个类名叫SQLiteUserRepository。

但它不限于SQLite。

它用共享的异步session工厂。

Postgres和SQLite都通过同一个类支持。

构造函数直接接收session工厂。

这个模式与`deerflow.persistence.*`下的另外四个仓库一致。

调用方在`init_engine_from_config()`运行之后再构造这个类。

## 二、类的成员

### 1、方法

- `__init__(session_factory)`：接收共享的异步session工厂。
- `create_user(user)`：插入新用户。邮箱先规范化为小写。任何唯一性冲突抛ValueError。冲突消息指明具体是哪种冲突。
- `create_first_admin(user)`：原子地插入第一个管理员。管理员已存在时返回None。管理员计数和插入在同一个事务里，且写入者先串行化。
- `get_user_by_id(user_id)`：按ID查用户。
- `get_user_by_email(email)`：按邮箱查用户。大小写不敏感匹配。按`created_at`排序取最旧的账号。
- `update_user(user)`：更新用户。行不存在时抛UserNotFoundError。邮箱只在真正变化时才规范化。
- `count_users()`：返回用户总数。
- `list_user_ids()`：返回全部用户ID。按创建顺序排列。
- `count_admin_users()`：返回管理员数量。
- `get_user_by_oauth(provider, oauth_id)`：按OAuth提供方和ID查用户。
- `_row_to_user`和`_user_to_row`：数据库行与User模型的双向转换。SQLite读回的时间戳缺tzinfo时会补UTC。
- `_insert_user(session, user)`：预检查邮箱并flush用户。事务由调用方持有。`create_user`和`create_first_admin`共用。
- `_serialize_first_admin_claim(session)`：串行化并发的首个管理员认领。SQLite用`BEGIN IMMEDIATE`取数据库写锁。Postgres用固定键的事务级咨询锁。其他方言直接抛错。

### 2、模块级辅助函数

- `_normalize_email(email)`：把邮箱规范化为小写。这是邮箱大小写问题的核心修复。
- `_driver_constraint_name(exc)`：从驱动异常里取被违反约束的名字。
- `_is_oauth_identity_violation(exc)`：判断是否OAuth身份唯一索引的冲突。绝不使用`str(exc)`判断。
- `_is_email_violation(exc)`：判断是否邮箱唯一索引的冲突。
- `_is_uniqueness_violation(exc)`：判断是否唯一性冲突。排除NOT NULL、CHECK、外键错误。
- `_violated_constraint(exc)`：尽力取出约束名，用于诊断。

### 3、邮箱规范化的意义

邮箱标识唯一一个账号。

两个写入路径曾经过不一致的规范化。
>
本地注册走EmailStr，只小写域名部分。
>
OIDC开户小写整个地址。
>
`Victim@x.com`和`victim@x.com`变成两行。
>
这破坏了"本地账号阻止同邮箱SSO登录"的不变量。

现在的修复是每个写入点都小写，读取时大小写不敏感匹配。

旧数据里的混合大小写行仍能解析，不需要破坏性的批量重写。

## 三、它和谁协作

UserRepository是它实现的抽象接口。

UserNotFoundError是它抛出的"行不存在"异常。

`User`模型是它的数据载体。

`UserRow`是它操作的SQLAlchemy ORM行。

`deerflow.persistence.engine`提供session工厂。

LocalAuthProvider把所有数据库操作委托给它。

首个管理员的认领锁用固定63位键`pg_advisory_xact_lock(bigint)`，不与其他咨询锁用户冲突。

## 四、重要性评级

评级：8分。

理由：这是用户数据的唯一真实来源。登录、开户、密码修改、管理员统计都经过它。它处理了大量并发和边界情况：首个管理员认领的原子性、邮箱大小写不变量、驱动异常的精确分类、并发删除的硬失败。这些都直接关联账户安全和数据正确性。docstring里记录了多个真实踩过的坑。它是这批类里逻辑最重的一个。
