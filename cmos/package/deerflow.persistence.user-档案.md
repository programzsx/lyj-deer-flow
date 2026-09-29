# deerflow.persistence.user-档案

源码路径：backend/packages/harness/deerflow/persistence/user/__init__.py

## 一、这个包是干什么的

这个包负责用户账号数据的ORM模型。

这个包只放模型。

具体的仓库实现不在harness包里。

实现在app层。

实现位置是app.gateway.auth.repositories.sqlite。

实现做ORM行和auth模块pydanticUser类的转换。

这样harness包不用依赖app代码。

依赖方向是app导入deerflow。

deerflow永不导入app。

这个方向由test_harness_boundary.py强制。

这个包对应数据库里的users和user_preferences两张表。

## 二、包里的主要成员

（1）model.py的UserRow

UserRow对应users表。

一行代表一个用户。

字段如下。

id是主键。

id是UUID。

UUID存成36字符字符串。

这样跨后端可移植。

email是邮箱。

email上有唯一索引。

password_hash是密码哈希。

可为空。

可空支持纯OAuth账号。

system_role是系统角色。

角色是admin或user。

存成普通字符串。

这是为了避免加新角色时的ALTER TABLE。

created_at是创建时间。

oauth_provider和oauth_id是OAuth关联。

oauth_provider和oauth_id上有部分唯一索引。

一个(provider, oauth_id)对只能有一个账号。

NULL行不受约束。

纯密码账号可以共存。

needs_setup是初始化标志。

token_version是令牌版本。

版本用于使旧令牌失效。

索引名是常量OAUTH_IDENTITY_INDEX_NAME。

索引名是单一来源。

auth仓库的违例检查用同一个常量匹配Postgres错误。

之前名字是分开的硬编码字面量。

没有测试防止两处漂移。

migration文件故意不导入这个常量。

migration是冻结的历史DDL。

migration 0018保留自己的字面量。

sqlite_where和postgresql_where都设置了。

只设sqlite_where在Postgres上会建全量唯一索引。

全量索引不是正确性问题。

Postgres和SQLite都把NULL当作互不相等。

真实重复已被拒绝。

NULL行已放行。

postgresql_added有两个小理由。

理由一是注释字面匹配。

理由二是部分索引只索引非NULL行。

索引更小，维护更便宜。

（2）UserPreferenceRow

UserPreferenceRow对应user_preferences表。

一行代表一个偏好键。

主键是(user_id, key)复合主键。

user_id是外键。

指向users.id。

级联删除。

value是JSON。

键相互独立。

独立键允许并发客户端patch互不重叠的偏好。

（3）preferences.py的UserPreferencesRepository

这个类在harness层。

方法如下。

get返回某用户的全部偏好。

返回形式是{key: value}字典。

patch更新偏好。

patch用upsert。

只更新显式提供的键。

null值重置字段。

插入语句按方言选择。

Postgres用pg_insert。

SQLite用sqlite_insert。

冲突时更新value。

键按排序顺序处理。

一致键序避免相反顺序的行锁环。

整个patch在一个事务里。

## 三、它和谁协作

app.gateway.auth的仓库实现转换UserRow。

users表是认证的基础。

user_preferences服务于偏好API。

Gateway的GET/PATCH偏好端点用UserPreferencesRepository。

偏好端点只允许通知开关、默认模型、会话模式、推理努力。

偏好端点要求浏览器会话加X-Expected-User-Id。

PAT、内部、关闭认证的调用者被拒。

这个包依赖base.py的Base类。

模型由Base.metadata.create_all创建。

## 四、重要性评级

评级：8分。

理由：

users表是认证的根基。

用户账号丢失意味着所有人无法登录。

OAuth唯一索引直接关系账号安全。

token_version关系令牌失效机制。

但模型本身很薄。

逻辑都在app层的仓库里。

偏好数据是边缘数据。

所以这个包是8分。
