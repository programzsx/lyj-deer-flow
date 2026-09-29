# deerflow.persistence.personal_access_tokens.model-档案

## 一、这个模块是干什么的

这个模块定义个人访问令牌的ORM模型。

个人访问令牌简称PAT。

PAT是程序化API访问用的令牌。

模型类叫PersonalAccessTokenRow。

模型对应数据库里的personal_access_tokens表。

用户可以创建PAT。

PAT让脚本和工具用令牌调API。

不用浏览器会话。

## 二、模块里的主要成员

### 1、PersonalAccessTokenRow类

PersonalAccessTokenRow继承自Base。

PersonalAccessTokenRow对应personal_access_tokens表。

表由alembic迁移0017创建。

#### （1）id列

id是主键。

id用uuid字符串。

长度64。

#### （2）user_id列

user_id是令牌的拥有者。

user_id不允许为空。

user_id有索引。

#### （3）name列

name是令牌的名字。

用户给令牌起的名字。

name不允许为空。

长度128。

#### （4）token_digest列

token_digest是令牌的SHA-256十六进制摘要。

原始令牌形如dfp_开头。

原始令牌只存在于创建响应里。

原始令牌永不落库。

原始令牌也永不进日志。

表通过命名唯一索引强制digest唯一。

索引用命名索引而不是列级约束。

命名索引让create_all的输出和迁移0017保持一致。

降级也能在引导过的数据库上工作。

#### （5）scopes列

scopes是权限范围列表。

JSON类型。

scopes是app.gateway.authz拥有的路由权限字符串的子集。

scopes不允许为空。

#### （6）时间字段

expires_at是过期时间。

可为None。

None表示永不过期。

last_used_at是最后使用时间。

created_at是创建时间。

revoked_at是撤销时间。

可为None。

None表示未被撤销。

## 三、它和谁协作

### 1、它依赖谁

它依赖deerflow.persistence.base的Base。

### 2、谁依赖它

personal_access_tokens/sql.py的PersonalAccessTokenRepository用这个模型读写行。

app层的auth代码用repository做令牌认证。

migrations/versions/0017_personal_access_tokens.py创建这张表。

## 四、重要性评级

评级是6分。

理由如下。

程序化API访问的令牌存储靠这张表。

原始令牌永不落库的设计在这里被记录。

digest唯一索引用命名索引保持create_all和迁移一致。

扣分的原因是它是纯模型文件。

没有读写逻辑。

PAT是辅助的访问方式。

主要访问方式是浏览器会话。
