# app.gateway.auth.repositories.sqlite 档案

## 一、这个模块是干什么的

这个模块是用户仓库的SQLAlchemy实现。

这个模块的文件位置是`backend/app/gateway/auth/repositories/sqlite.py`。

这个模块实现了一个类。这个类叫`SQLiteUserRepository`。

这个类实现了`UserRepository`抽象接口的全部方法。

这个类负责把`User`对象读写到数据库的`users`表。

`users`表和`threads_meta`、`runs`、`run_events`、`feedback`在同一个数据库里。

这个类使用共享的异步会话工厂。会话工厂来自`deerflow.persistence.engine`。

这个模块的名字叫sqlite。但实现同时支持SQLite和Postgres。两种数据库由同一个引擎层决定。

这个模块处理的难点不是普通增删改查。普通增删改查很简单。这个模块的难点是并发控制、唯一性冲突归因、邮箱大小写归一化。这三块是模块里最复杂也最有价值的部分。

## 二、模块里的主要成员

### 1、常量

`_EMAIL_UNIQUE_INDEX_NAME`是邮箱唯一索引的名字。值是`ix_users_email`。

`email`列用`mapped_column(unique=True, index=True)`定义。SQLAlchemy把它实现为单个UNIQUE INDEX。不是命名的UNIQUE约束。所以Postgres报告重复时报的是索引名。

`_FIRST_ADMIN_LOCK_KEY`是Postgres咨询锁的固定键。63位整数。键来自字符串`deerflow:auth:first-admin-claim`的SHA256哈希。固定键保证不和数据库里其他咨询锁用户冲突。

### 2、_driver_constraint_name函数

这个私有函数从驱动异常里提取被违反约束的名字。

提取不到时返回`None`。

这个函数解决一个很隐蔽的问题。`exc.orig`不是原始驱动错误。SQLAlchemy的asyncpg方言会重新抛出一个包装过的异常。包装异常只有`pgcode`和`sqlstate`。真正的`asyncpg.UniqueViolationError`带着`constraint_name`。真错误挂在`exc.orig.__cause__`上。

所以这个函数检查两层。先检查`exc.orig`。再检查`exc.orig.__cause__`。

aiosqlite不暴露约束名。SQLite走消息匹配的路线。

### 3、_is_oauth_identity_violation函数

这个函数判断异常是否是OAuth身份唯一索引的违反。

OAuth身份索引是`idx_users_oauth_identity`。索引列是`oauth_provider`加`oauth_id`。

这个函数绝不用`str(exc)`做子串匹配。SQLAlchemy的异常字符串嵌入了完整INSERT语句。语句的列清单每次都写着`oauth_provider`和`oauth_id`。不管实际违反的是哪个约束。子串匹配会把每次提交时的`IntegrityError`都误判成OAuth冲突。

这个错误在SQLite上复现过。重复的`id`曾被误报为"OAuth account already linked: None/None"。

Postgres走驱动约束名匹配。SQLite要求消息里同时出现两个oauth列名。不允许只匹配裸的"oauth"子串。

### 4、_is_email_violation函数

这个函数判断异常是否是邮箱唯一索引的违反。

判断方式和OAuth身份判断一样。走驱动约束名检查。不用带INSERT文本的字符串。

### 5、_is_uniqueness_violation函数

这个函数判断异常是否是唯一索引或主键违反。

这个函数排除其他`IntegrityError`。NOT NULL、CHECK、外键违反都不是"用户已存在"。只有唯一违反才是。

Postgres看`sqlstate`是否是`23505`。`23505`是unique_violation。

SQLite看消息里是否有"unique constraint failed"或"primary key constraint failed"。

### 6、_violated_constraint函数

这个函数尽力提取异常背后的约束名。

用于诊断信息。诊断不把无归属的违反错误地归到某个列上。

优先用驱动约束名。没有驱动名时解析SQLite消息里的列名。

### 7、_normalize_email函数

这个私有函数把邮箱归一化为小写。

这个函数解决一个真实漏洞。

问题背景是这样的。邮箱标识唯一账号。但两个写路径的归一化不一致。本地注册用`EmailStr`。`EmailStr`只把域名小写。本地部分保留大小写。OIDC开通把整个地址小写。

归一化不一致加上之前的大小写敏感查询。`Victim@x.com`和`victim@x.com`解析成两个独立账号。这破坏了一个不变量。本地账号应该挡住同邮箱的SSO登录。这个不变量被击败了。

修复方案是这样的。所有写点都小写归一化。所有读点做大小写不敏感匹配。新账号的缺口被堵上。已有的混合大小写行仍然能解析。不需要破坏性的批量重写。

### 8、SQLiteUserRepository类

这个类是模块的主类。

这个类继承`UserRepository`。

构造函数直接接收会话工厂。参数类型是`async_sessionmaker[AsyncSession]`。这和其他四个`deerflow.persistence`仓库的模式一致。调用方在`init_engine_from_config()`运行之后构造这个类。

### 9、_row_to_user和_user_to_row转换器

这两个静态方法在数据库行和`User`对象之间转换。

`_row_to_user`有一个细节。SQLite读回时间戳会丢掉时区信息。代码重新附加UTC。下游代码就能可靠地比较时间戳。

### 10、create_user方法

这个方法插入新用户。

方法先归一化邮箱。然后调用`_insert_user`。然后提交。

任何唯一违反都抛`ValueError`。异常消息指明具体冲突。重复邮箱。OAuth账号重复。重复ID。其他`IntegrityError`原样传播。

### 11、_insert_user方法

这个私有方法做邮箱预检查并flush用户。

事务归调用方管。

这个方法被`create_user`和`create_first_admin`共享。两个方法报告相同的唯一冲突。

流程是这样的。先归一化邮箱。再用`func.lower`做大小写不敏感的预查询。查到已存在就抛`ValueError`。然后插入并flush。flush抛`IntegrityError`时回滚。回滚后逐类归因。

归因顺序是这样的。先归因OAuth身份违反。再归因邮箱违反。再归因其他唯一违反。都不是就原样抛出。

预检查挡住了常规条件下的邮箱冲突。所以到达归因的`IntegrityError`通常是OAuth身份冲突。但不总是。可能是重复主键。也可能是竞态中溜过预检查的邮箱冲突。所以归因要看真正触发的约束。不能靠假设。

### 12、_serialize_first_admin_claim方法

这个静态方法串行化并发的首个管理员认领。

SQLite用`BEGIN IMMEDIATE`提前拿数据库写锁。这是项目仓库处理读后写事务的惯例。

Postgres没有行可锁。首次启动时表是空的。Postgres用固定键的事务级咨询锁。做法和渠道OAuth配额的上限一样。

两种策略都没有的方言直接抛错。这个点是`create_first_admin`原子性的根基。直接放过会留下普通的先检查后行动。两个首次启动请求会都创建管理员。

当前引擎只构建这两种方言。抛错是给未来后端的守卫。不是可达路径。

### 13、create_first_admin方法

这个方法把用户插入为第一个管理员。

方法先串行化认领。再统计管理员数。有管理员就返回`None`。没有就插入并提交。

`None`表示认领失败。调用方报告"已初始化"。唯一冲突仍然抛`ValueError`。

### 14、get_user_by_id方法

这个方法按ID查用户。

内部用`session.get`。

### 15、get_user_by_email方法

这个方法按邮箱查用户。

查询用`func.lower`做大小写不敏感匹配。

结果按`created_at`排序取第一个。排序是确定性的。修复前的数据库可能存着两个只差大小写的行。取最旧的账号比抛500好。`id`是次级决胜键。两个旧行的`created_at`相同时选择仍然是确定的。

### 16、update_user方法

这个方法更新已有用户。

行不存在时抛`UserNotFoundError`。这是硬失败。调用方包括`reset_admin`、改密码处理器、`_ensure_admin_user`。这些调用方都在调用前刚查过用户。行缺失说明行在下面消失了。静默成功会让调用方为一个不存在的行记录"密码已重置"。

邮箱归一化有一个精细的守卫。只有邮箱真的变了才归一化。比较是大小写不敏感的。守卫比较的是归一化后的值。

守卫的原因是这样。对未变化的旧混合大小写邮箱重新小写化会撞上另一行的唯一邮箱。例如修复前的`Victim@x.com`行和规范的`victim@x.com`行同时存在。改密码这样的纯更新会把旧值改写成规范值。然后撞唯一索引。变成改密码路径上的500。只比较规范值和存储原始值不够。混合大小写行的规范形式仍然和它自己的存储大小写不同。还是会重写还是会撞。真正的变化仍然会归一化。唯一约束继续对更新后的行强制大小写不敏感唯一。

更新会回写持久化值到返回对象。`user.email = row.email`。

### 17、count_users、list_user_ids、count_admin_users方法

这三个方法是简单查询。

`count_users`统计总行数。

`list_user_ids`按`created_at`加`id`排序返回所有ID。

`count_admin_users`统计`system_role`为`admin`的行数。

### 18、get_user_by_oauth方法

这个方法按`oauth_provider`和`oauth_id`查用户。

查询用`scalar_one_or_none`。

## 三、它和谁协作

### 1、它依赖谁

它依赖`deerflow.persistence.engine`。会话工厂来自这里。

它依赖`deerflow.persistence.user.model`。`UserRow`是`users`表的ORM模型。`OAUTH_IDENTITY_INDEX_NAME`是OAuth身份索引名。

它依赖`app.gateway.auth.models`的`User`。

它依赖`app.gateway.auth.repositories.base`的`UserRepository`和`UserNotFoundError`。

它依赖SQLAlchemy的异步会话。

### 2、谁调用它

`app.gateway.deps`调用它。`deps.py`在引擎初始化后构造`SQLiteUserRepository`。构造后注入给`LocalAuthProvider`。

`app.gateway.auth.reset_admin`调用它。重置管理员工具直接构造这个仓库。

### 3、和引擎的关系

这个模块不创建引擎。引擎由`init_engine_from_config()`创建。数据库可以是SQLite也可以是Postgres。两种方言的差异都在这个模块内部处理。

## 四、重要性评级

评级：7分。

理由如下。

这个模块是用户数据落库的唯一实现。所有用户的创建、查询、更新都经过这个类。

这个模块处理了大量真实的并发和数据一致性难题。首个管理员的原子认领用方言锁串行化。唯一违反的归因绝不靠异常字符串。邮箱大小写归一化堵住了"本地账号挡不住同邮箱SSO登录"的真实漏洞。

这些难题的注释非常详尽。每个细节都写明了为什么。例如`str(exc)`误判OAuth冲突的复现案例。例如混合大小写邮箱在改密码路径上的500。这些是实际踩过的坑。

评级不到9分的原因是：这个模块只管`users`一张表。功能面窄。而且数据库并发控制的底座在`deerflow.persistence.engine`和迁移层，不在本模块。

评级不到5分的原因是：删掉这个模块，用户存储就没有实现。认证系统完全瘫痪。而且模块里的归因函数和归一化守卫需要非常仔细地复刻。漏掉任何一处都会重新引入已修复的漏洞。
