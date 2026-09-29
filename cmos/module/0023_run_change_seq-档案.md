# 0023_run_change_seq档案

## 一、这个迁移是干什么的

给`runs`表加稳定的变更发现位置。扩展的运行证据服务需要一个游标。游标绑定（change_seq, run_id）。这个迁移加change_seq列、变更时钟表和相关索引。

## 二、做了什么schema变更

- 给`runs`加`change_seq`列。BigInteger。NOT NULL。默认0。
- 创建`run_change_clock`表。单行的变更时钟。每次运行变化时递增。
- 创建索引`ix_runs_change_seq`。按（change_seq, run_id）。
- 创建索引`ix_runs_user_change_seq`。按（user_id, change_seq, run_id）。

## 三、涉及哪些表

`runs`和`run_change_clock`。

## 四、重要细节

幂等。表、列、索引全部先检查再创建。

## 五、重要性评级

评级是7分。

理由。change_seq是变更发现的基础。扩展的运行证据服务靠它发现变化的运行。游标绑定（change_seq, run_id）。没有它，变更发现要全表扫描。这个迁移也是#5516修复的根源（见0025）。
