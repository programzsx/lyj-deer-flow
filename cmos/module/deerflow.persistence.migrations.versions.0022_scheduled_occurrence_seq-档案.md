# 0022_scheduled_occurrence_seq档案

## 一、这个迁移是干什么的

给定时任务持久化每任务的发生顺序和幂等的launch计数。调用方时钟无法重建入队顺序。也无法证明哪些历史launch被计数过。这些必须持久化。

## 二、做了什么schema变更

- 给`scheduled_tasks`加`last_occurrence_seq`列。BigInteger。NOT NULL。默认0。
- 给`scheduled_task_runs`加`occurrence_seq`列。BigInteger。可为NULL。每任务的发生顺序。
- 给`scheduled_task_runs`加`launch_accounted`列。Boolean。可为NULL。launch是否已被计数。
- 创建唯一索引`uq_scheduled_task_run_occurrence_seq`。按（task_id, occurrence_seq）。

## 三、涉及哪些表

`scheduled_tasks`和`scheduled_task_runs`。

## 四、重要细节

两个旧字段保持NULL。因为调用方时钟无法重建入队顺序或证明计数。NULL保留这个不可知。唯一索引支持按任务的顺序分配。

## 五、重要性评级

评级是6分。

理由。occurrence_seq让每次发生有持久的顺序。launch_accounted让launch计数幂等。没有它们，重启后的顺序和计数靠不住。索引防止重复的顺序值。
