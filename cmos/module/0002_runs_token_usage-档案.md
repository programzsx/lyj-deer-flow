# 0002_runs_token_usage档案

## 一、这个迁移是干什么的

给`runs`表加`token_usage_by_model`列。修复GitHub issue #3682。在某个提交之前创建的数据库缺少这一列。没有这个迁移，所有SELECT runs的接口都报"no such column"错误。

## 二、做了什么schema变更

- 给`runs`表加`token_usage_by_model`列。JSON类型。NOT NULL。服务器默认值`'{}'`。

服务器默认值的作用。让`ALTER TABLE ADD COLUMN ... NOT NULL`在有数据的表上成功。已有行在ALTER时拿到空对象默认值。不触发NOT NULL违规。也让升级后的数据库和新建数据库schema一致。

## 三、涉及哪些表

只涉及`runs`表。

## 四、重要细节

用`safe_add_column`做幂等。列已存在时是no-op。覆盖两个真实情况。一是用户手动加过这一列。二是多Gateway实例并发引导。

## 五、重要性评级

评级是6分。

理由。这一列是按模型分token用量的存储。issue #3682是真实的生产问题。安全加列和服务器默认值的设计让有数据的表升级不失败。
