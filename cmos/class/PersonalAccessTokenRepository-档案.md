# PersonalAccessTokenRepository-档案

## 一、这个类是干什么的

PersonalAccessTokenRepository是persistence/personal_access_tokens/sql.py里的类。

它是个人访问token的持久仓库。

管理PAT行的CRUD加撤销。

token以摘要存储。不存明文。

这个类位于backend/packages/harness/deerflow/persistence/personal_access_tokens/sql.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、PersonalAccessTokenRepository本身

构造方法带session_factory和last_used写间隔。

_last_used_write_interval默认300秒。

_last_used_write_at记录每个token的最后写时间。

last_used更新节流。避免每次认证都写。

### 2、create方法

创建token行。

token_digest是SHA-256摘要。

scopes排序存储。

expires_at可选。

### 3、get_active_by_digest方法

它返回token_digest的非撤销、非过期行。

撤销和过期在这里评估。

stale持久行永不能认证。

尽管它保持可读供审计历史。

SQLite读时丢tzinfo。

比较前规整。

### 4、list_for_user方法

返回用户的token列表。按created_at降序。

### 5、revoke方法

它撤销用户的一个token。

不拥有或缺席时返回False。

WHERE带revoked_at IS NULL。

幂等。

### 6、_row_to_dict

时间戳用coerce_iso规整。

SQLite丢tzinfo。规整成tz-aware。

## 三、它和谁协作

- PersonalAccessTokenRow是ORM行。
- auth providers验证PAT。
- token_digest是认证查找键。

## 四、重要性评级

评级是6分。

理由如下。

这个仓库是PAT认证的持久层。

撤销和过期在认证时评估。

stale行永不能认证。

token以摘要存储。

last_used写节流。

SQLite时区规整。

这些是token安全的关键。

扣掉4分。

扣分原因是它是数据访问层。
