# UserRow-档案

## 一、这个类是干什么的

UserRow是persistence/user/model.py里的ORM模型。

说明。

UserRow这个名字在代码库里出现两次。

另一处在backend/packages/harness/deerflow/tui/view_state.py。

本档案写的是persistence层那个。

那个是TUI的视图状态数据类。

这个类是users表的ORM模型。

它定义用户账户的持久化行。

它放在harness持久化包里。

这样Base.metadata.create_all()能把它和threads_meta、runs、run_events、feedback一起建表。

使用共享引擎的好处如下。

一个SQLite或Postgres数据库，一个连接池。

一个schema初始化路径。

auth读取和持久化读取用一致的异步会话。

这个类位于backend/packages/harness/deerflow/persistence/user/model.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、UserRow字段

- id是主键。UUID存成36字符字符串。为了跨后端可移植。
- email是邮箱。unique且不可空。有索引。
- password_hash是密码哈希。可为None。OAuth账户可以没有密码。
- system_role是系统角色。取值是"admin"或"user"。保持普通字符串。避免新角色引入时的ALTER TABLE痛苦。默认"user"。
- created_at是创建时间。
- oauth_provider和oauth_id是可选的OAuth链接。
- needs_setup是认证生命周期标记。默认False。
- token_version是令牌版本。默认0。用于令牌失效。

### 2、OAuth部分唯一索引

OAUTH_IDENTITY_INDEX_NAME是索引名的单一事实来源。

sqlite.py的_is_oauth_identity_violation要按这个名字匹配Postgres驱动的约束名。

以前这个名字是那里单独的硬编码字面量。

没有测试捕捉两者漂移。

部分唯一索引强制每个(provider, oauth_id)对一个账户。

NULL行不受约束。普通密码账户可以共存。

sqlite_where单独是SQLAlchemy方言特有的参数。

它不适用于postgresql方言。

只有sqlite_where建的是全量唯一索引。

注释验证了这不是正确性问题。

全量索引已经强制了预期语义。

Postgres把NULL当成永不相等。

postgresql_where加入的原因有两个。

第一，字面上匹配注释。两个后端都是部分索引。

第二，部分索引只索引非NULL行。

普通密码账户行累积时索引更小更便宜。

### 3、UserPreferenceRow

同模块的另一个模型。

user_preferences表。

user_id加key做联合主键。

value是JSON列。

独立的键让并发客户端可以修补不相交的偏好。

有外键指向users.id。级联删除。

## 三、它和谁协作

- Gateway auth的UserRepository和SQLiteUserRepository读写这个模型。
- persistence/base的Base提供序列化。
- UserPreferencesRepository读写UserPreferenceRow。

## 四、重要性评级

评级是6分。

理由如下。

这个模型是全系统用户账户的基础。

OAuth链接的部分唯一索引处理了SQLite和Postgres的方言差异。

注释验证了非正确性问题。

索引名的单一事实来源防漂移。

token_version支持令牌失效。

但它是ORM模型。

只有字段和表约束。

扣掉4分。
