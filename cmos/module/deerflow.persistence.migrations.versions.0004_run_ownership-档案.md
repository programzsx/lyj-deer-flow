# 0004_run_ownership档案

## 一、这个迁移是干什么的

给`runs`表加运行所有权字段。并创建两个索引。支持多worker部署下的运行所有权和线程活跃约束。

## 二、做了什么schema变更

- 给`runs`加`owner_worker_id`列。持有运行的worker id。
- 给`runs`加`lease_expires_at`列。租约过期时间。
- 创建`ix_runs_lease`索引。按租约过期时间查。
- 创建`uq_runs_thread_active`部分唯一索引。每个thread最多一个pending或running的运行。

## 三、涉及哪些表

只涉及`runs`表。

## 四、重要细节

这个迁移做数据修复。部分唯一索引建不出来时（同thread已有多个活跃行），先取消多余的行。保留每thread最新的活跃行（按created_at和run_id排序）。其余标成error。取消的行带解释性的error字符串。操作员能看到为什么运行被杀。

索引创建是幂等的。索引已存在就不重建。

## 五、重要性评级

评级是7分。

理由。uq_runs_thread_active是线程运行生命周期的关键约束。同一thread不会有两个并发运行。数据修复的设计让违反不变量的旧数据库也能升级。
