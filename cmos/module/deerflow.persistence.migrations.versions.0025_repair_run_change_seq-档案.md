# 0025_repair_run_change_seq档案

## 一、这个迁移是干什么的

修复0023插入时被跳过的运行变更时钟schema。修复issue #5516。

`0023_run_change_seq`被插到`0022_scheduled_occurrence_seq`和已经发布的`0023_user_preferences`之间。Alembic只从数据库的stamped revision向前走。所以每个已经到达0023_user_preferences（或更后）的数据库把0023_run_change_seq当作已应用的祖先。永远不执行它。那些数据库永久缺少`run_change_clock`表、`runs.change_seq`列和索引。第一个递增变更时钟的运行存储操作失败。重启也不能愈合。因为stamped revision已经在0023或更后。

这个迁移为每个升级过它的数据库重新应用和0023相同的幂等DDL。

## 二、做了什么schema变更

和0023完全相同。

- 给`runs`加`change_seq`列。BigInteger。NOT NULL。默认0。
- 创建`run_change_clock`表。
- 创建索引`ix_runs_change_seq`和`ix_runs_user_change_seq`。

全部步骤的防护和0023一样。健康形状上全部no-op。

## 三、涉及哪些表

`runs`和`run_change_clock`。

## 四、重要细节

降级是刻意的no-op。变更时钟schema和已分配的时钟位置归祖先0023所有。在这里删掉它们会让一个stamped在0024的数据库没有0023的schema。重新制造#5516的洞。还会永久丢弃游标值。降级到0023本身才是删除schema的正确路径。通过0023自己的降级。

## 五、重要性评级

评级是7分。

理由。这个迁移修复一个真实的迁移链缺陷。插入已发布链中间导致已升级的数据库永久缺schema。运行存储操作失败且重启不能愈合。这个修复让那些数据库升级后恢复schema。降级no-op的设计防止重新制造同一个洞。
