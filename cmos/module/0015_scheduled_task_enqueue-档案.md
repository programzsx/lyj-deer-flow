# 0015_scheduled_task_enqueue档案

## 一、这个迁移是干什么的

给定时任务加持久的入队状态。

在这个迁移之前。queued是一个瞬时的预launch标记。启动时中断崩溃遗留。持久入队给同一个值一个新含义。所以升级边界要保留旧的重启行为。不能launch一个可能已经跑过的发生记录。

## 二、做了什么schema变更

- 给`scheduled_task_runs`加`lease_owner`列。
- 给`scheduled_task_runs`加`lease_expires_at`列。
- 给`scheduled_task_runs`加`attempt_count`列。默认0。
- 替换活跃索引。where条件从('queued', 'running')扩大到('queued', 'launching', 'running')。
- 数据迁移。把overlap_policy为'skip'的定时任务改成'enqueue'。

## 三、涉及哪些表

`scheduled_tasks`和`scheduled_task_runs`。

## 四、重要细节

升级时把状态为queued的发生记录全部标成interrupted。带解释性error和finished_at。因为旧语义的queued可能是崩溃遗留。新语义的queued是持久入队。保留旧重启行为比launch一个可能跑过的记录安全。

降级时把launching改回queued。因为旧调度器不认识launching。部署不能留下一个旧调度器不知道的状态。

## 五、重要性评级

评级是7分。

理由。持久入队是定时任务调度语义的一次升级。queued从瞬时标记变成持久状态。升级边界的数据迁移防止launch一个可能已经跑过的记录。launching状态支持租约保护的领取。
