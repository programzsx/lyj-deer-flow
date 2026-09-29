# 0021_batch_acceptance档案

## 一、这个迁移是干什么的

给`subagent_batch_items`表加持久的批次验收标准和方法判定字段。一个批次项可以带验收标准。执行后带验收判定。

## 二、做了什么schema变更

- 给`subagent_batch_items`加`acceptance_criteria`列。JSON。可为NULL。验收标准。
- 给`subagent_batch_items`加`acceptance_verdict`列。JSON。可为NULL。验收判定。

## 三、涉及哪些表

只涉及`subagent_batch_items`表。

## 四、重要细节

用`safe_add_column`做幂等。两个字段都是可选的。不设置验收标准的批次项保持NULL。

## 五、重要性评级

评级是5分。

理由。验收标准让批次项的完成可以被机器判定。判据持久化后可以追溯。变更本身是两个可选列。
