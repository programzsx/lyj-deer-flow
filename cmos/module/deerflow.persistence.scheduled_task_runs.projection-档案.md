# deerflow.persistence.scheduled_task_runs.projection-档案

## 一、这个模块是干什么的

这个模块定义父任务投影和launch计数的规则。

投影指从子出现的状态推出父任务的状态。

launch计数指统计任务运行了多少次。

这些操作在定时任务的行锁下执行。

规则必须统一。

规则在这里集中定义。

完成路径和两个恢复路径都用同一份规则。

规则漂移就是bug。

## 二、模块里的主要成员

### 1、can_project函数

这个函数判断一次出现能否被投影。

#### （1）无序号的历史

occurrence_seq为None时。

任务的高水位必须是0才能投影。

高水位是last_occurrence_seq。

这是把无序号的legacy历史保持为尽力而为。

直到一个带序号的run被准入。

#### （2）带序号的出现

occurrence_seq不为None时。

出现序号必须等于任务的高水位。

相等才能投影。

不相等说明出现了更新的出现。

旧出现不能投影。

### 2、account_launch函数

这个函数把一次被证明的launch计一次数。

计数和标记在同一个事务里。

#### （1）幂等保护

launch_accounted是True时返回False。

已计数过的出现不再计数。

#### （2）legacy处理

launch_accounted是None时是legacy行。

legacy行保留旧的last_run_id推断做首次修复。

legacy行且task.last_run_id等于这个run_id时。

说明已经计过。

返回False。

#### （3）正常计数

正常情况任务run_count加一。

陈旧的出现可能改变计数。

但不能改变当前投影的时间戳。

同时投影结果的调用方自己显式设置updated_at。

flag_modified标记updated_at。

标记让SQLAlchemy把这个值写进SET。

onupdate钩子不会另外触发。

### 3、设计说明

launch_accounted防止同一个出现被数两次。

原因是恢复路径可能重复处理同一次launch。

计数和标记在同一个事务里。

标记和计数是原子的。

恢复的出现不会被计入两次。

## 三、它和谁协作

### 1、它依赖谁

它只依赖SQLAlchemy的flag_modified。

模型类型只在TYPE_CHECKING下导入。

导入是循环的。

所以用TYPE_CHECKING避免。

### 2、谁依赖它

scheduled_tasks/sql.py的complete_run和恢复路径用这两个函数。

scheduled_task_runs/sql.py的launch相关方法也用它们。

migrations/versions/0022_scheduled_occurrence_seq.py引入了序号字段。

## 四、重要性评级

评级是6分。

理由如下。

投影和计数的规则必须统一。

规则集中在这里才不会在三条路径间漂移。

can_project把legacy历史处理得很小心。

account_launch的幂等设计防止重复计数。

扣分的原因是这个模块很小。

只有两个函数。

它只服务定时任务一条链路。
