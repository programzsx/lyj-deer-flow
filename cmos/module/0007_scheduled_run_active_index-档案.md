# 0007_scheduled_run_active_index档案

## 一、这个迁移是干什么的

创建定时任务运行的活跃唯一索引。每个定时任务最多一个queued或running的发生记录。

这个索引修复一个真实的TOCTOU竞争。两个并发的dispatch_task调用都通过了has_active_runs检查。都插入了一个queued行。索引防止这种重复。

## 二、做了什么schema变更

- 创建`uq_scheduled_task_run_active`部分唯一索引。在`scheduled_task_runs`表。按task_id。where条件是status IN ('queued', 'running')。

## 三、涉及哪些表

只涉及`scheduled_task_runs`表。

## 四、重要细节

和0004一样做数据修复。索引建不出来时先取代多余的活跃行。保留每task最新的活跃行。其余标成interrupted。带解释性error和finished_at。语义和`mark_stale_active_runs`的孤儿处理一致。

DateTime绑参数带类型。让SQLAlchemy应用方言的绑定处理器。Python 3.12删了sqlite3的默认datetime适配器。不带类型的话原始datetime会直接交给DBAPI失败。

索引创建幂等。

## 五、重要性评级

评级是7分。

理由。这个索引是定时任务重叠保护的关键约束。一个任务不会有两个活跃发生记录。TOCTOU修复加数据修复让旧数据库升级不失败。
