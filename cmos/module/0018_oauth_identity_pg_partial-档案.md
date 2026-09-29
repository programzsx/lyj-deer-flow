# 0018_oauth_identity_pg_partial档案

## 一、这个迁移是干什么的

修复Postgres上`idx_users_oauth_identity`索引的缺失部分谓词。

0001_baseline建这个索引时只传了sqlite_where。没传postgresql_where。所以所有通过`alembic upgrade head`配置的部署在Postgres上拿到的是全表唯一索引。ORM元数据只影响新建数据库。不影响已经versioned的数据库。

这不是正确性bug。NULL在唯一索引里从不等于NULL。真实重复已被拒绝。但索引保持全表大小。而不是只覆盖OAuth关联的行。

## 二、做了什么schema变更

- 在Postgres上。删除全表的`idx_users_oauth_identity`。重建为部分索引。where条件是oauth_provider IS NOT NULL AND oauth_id IS NOT NULL。

## 三、涉及哪些表

只涉及`users`表。

## 四、重要细节

只对Postgres执行。SQLite已经从0001拿到sqlite_where。

升级前检查索引是否存在且是全表形式。不存在（create_all已建过部分形式）或已有谓词（本迁移已跑过）就不动。降级是逆操作。

revision id必须保持在32字符以内。alembic_version.version_num是VARCHAR(32)。超长会 outright 失败。

## 五、重要性评级

评级是5分。

理由。这个迁移修复一个索引形状问题。不是正确性bug。是索引大小问题。部分索引只覆盖OAuth行。性能更好。修复设计谨慎。先检查实际形状再动。
