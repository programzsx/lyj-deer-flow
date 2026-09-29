# 0017_personal_access_tokens档案

## 一、这个迁移是干什么的

创建`personal_access_tokens`表。用户的个人访问令牌。令牌存哈希不存明文。

## 二、做了什么schema变更

- 创建`personal_access_tokens`表。id、user_id、name、token_digest、scopes（JSON）、expires_at、last_used_at、创建时间、revoked_at。
- 创建索引。user_id索引。token_digest唯一索引。

## 三、涉及哪些表

只涉及`personal_access_tokens`表。

## 四、重要细节

token_digest是SHA-256。令牌的明文不落库。唯一索引支持按digest查找。

这个迁移的docstring记录了编号约定。这个迁移和#5078、#4843的迁移都想占用0017。先合并的保留槽位。其他的在rebase时重新编号。

## 五、重要性评级

评级是6分。

理由。PAT表是个人访问令牌的存储基础。令牌存digest不存明文是正确的安全设计。expires_at和revoked_at支持过期和吊销。
