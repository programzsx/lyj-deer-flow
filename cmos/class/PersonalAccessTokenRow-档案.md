# PersonalAccessTokenRow-档案

## 一、这个类是干什么的

PersonalAccessTokenRow是persistence/personal_access_tokens/model.py里的ORM模型。

这个类是个人访问令牌PAT的持久化行。

personal_access_tokens表。

PAT让用户通过API token访问DeerFlow。

原始token只存在于创建响应里。

绝不持久化或记日志。

数据库只存SHA-256摘要。

这个类位于backend/packages/harness/deerflow/persistence/personal_access_tokens/model.py。

## 二、类的成员（字段，各自做什么）

字段如下。

- id是主键。
- user_id是拥有者。不可空。有索引。
- name是令牌显示名。不可空。
- token_digest是dfp_开头token的SHA-256摘要。不可空。

原始token只存在于创建响应。

绝不持久化或记日志。

命名的唯一索引而不是列级约束。

保持create_all的输出和migration 0017一致。

降级在bootstrap过的数据库上也能工作。

- scopes是路由权限字符串的子集。由app.gateway.authz拥有。JSON列。
- expires_at是可选的过期时间。
- last_used_at是最近使用时间。
- created_at是创建时间。不可空。
- revoked_at是撤销时间。

表级索引是ix_personal_access_tokens_token_digest。

这是token_digest的唯一索引。

认证时按摘要查找。

## 三、它和谁协作

- PersonalAccessTokenRepository读写这个模型。
- Gateway auth的PAT路由创建和撤销。
- authz的路由权限字符串是scopes的来源。

## 四、重要性评级

评级是6分。

理由如下。

这个模型是PAT认证的存储基础。

原始token绝不持久化。

只存SHA-256摘要。

这是真实的凭据安全设计。

命名的唯一索引保持migration一致性。

撤销和过期支持令牌生命周期。

但它是纯数据模型。

扣掉4分。
