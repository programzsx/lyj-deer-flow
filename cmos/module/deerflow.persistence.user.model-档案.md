# deerflow.persistence.user.model-档案

## 一、这个模块是干什么的

这个模块定义users表的ORM模型。

模型类是UserRow和UserPreferenceRow。

UserRow对应users表。

UserPreferenceRow对应user_preferences表。

users表存用户账号。

用户账号包括邮箱、密码哈希、角色、OAuth绑定。

这个模块放在harness持久化包里。

放这里的目的是被Base.metadata.create_all拾取。

和threads_meta、runs、run_events、feedback一起。

用共享引擎有三个好处。

好处一是只有一个SQLite或Postgres数据库。

好处二是只有一条结构初始化路径。

好处三是auth读取和持久化读取用一致的异步会话。

## 二、模块里的主要成员

### 1、OAUTH_IDENTITY_INDEX_NAME常量

这个常量是OAuth身份索引的名字。

名字是idx_users_oauth_identity。

这是单一事实来源。

app.gateway.auth.repositories.sqlite的_is_oauth_identity_violation用这个名字。

那个函数要把Postgres驱动错误的约束名匹配到这个字符串。

以前那个名字是那里的单独硬编码字面量。

没有测试能抓到两者漂移。

migrations下的迁移文件有意不导入这个常量。

迁移是冻结的历史DDL。

迁移不是模型的活视图。

所以0018_oauth_identity_pg_partial.py保留自己的字面量。

这是那个包的约定。

### 2、UserRow类

UserRow继承自Base。

UserRow对应users表。

#### （1）id列

id是主键。

UUID存成36字符字符串。

跨后端可移植。

#### （2）email列

email是邮箱。

email唯一。

email有索引。

email不允许为空。

长度320。

#### （3）password_hash列

password_hash是密码哈希。

可空。

可空对应纯OAuth账号。

长度128。

#### （4）system_role列

system_role是系统角色。

值是admin或user。

保留成普通字符串。

避免新角色引入时的ALTER TABLE麻烦。

默认user。

#### （5）created_at列

created_at是创建时间。

时区是UTC。

#### （6）oauth_provider列和oauth_id列

两个列是可选的OAuth绑定。

部分唯一索引强制一个(provider, oauth_id)对只有一个账号。

NULL行不受约束。

纯密码账号可以共存。

#### （7）needs_setup列和token_version列

needs_setup是初始化标志。

默认False。

token_version是令牌版本。

默认0。

token_version让全部令牌一次性失效。

#### （8）部分唯一索引

索引名叫idx_users_oauth_identity。

条件是oauth_provider IS NOT NULL AND oauth_id IS NOT NULL。

sqlite_where是SQLAlchemy的方言参数。

只在sqlite方言生效。

只有sqlite_where时Postgres上建的是全量唯一索引。

这不是正确性问题。

经验证Postgres的全量索引同样强制预期的语义。

Postgres和SQLite一样在唯一索引里把NULL当作永不相等。

真实的(provider, id)重复已经被拒绝。

无限的(NULL, NULL)行已经被允许。

postgresql_where加进来有两个较小的理由。

理由一是部分索引只在Postgres上索引非NULL行。

纯密码账号是常见情况。

部分索引更小更便宜。

理由二是注释和实现字面上一致。

### 3、UserPreferenceRow类

这个类对应user_preferences表。

user_preferences存用户偏好。

主键是(user_id, key)。

user_id是外键。

指向users.id。

级联删除。

key是偏好键。

长度40。

value是JSON值。

可空。

独立的键让并发的客户端能patch互不相干的偏好。

## 三、它和谁协作

### 1、它依赖谁

它依赖deerflow.persistence.base的Base。

### 2、谁依赖它

app层的auth仓库用UserRow读写用户。

user/preferences.py的UserPreferencesRepository用UserPreferenceRow读写偏好。

migrations/versions/0001_baseline.py创建users表的baseline部分。

0018_oauth_identity_pg_partial.py转换OAuth索引。

## 四、重要性评级

评级是8分。

理由如下。

users表是鉴权的根基。

没有用户账号就没有任何受保护的操作。

OAuth身份索引是单一事实来源。

部分唯一索引的设计理由在这里被完整记录。

user_preferences支撑了用户偏好功能。

扣分的原因是它是纯模型文件。

鉴权逻辑在app层。
