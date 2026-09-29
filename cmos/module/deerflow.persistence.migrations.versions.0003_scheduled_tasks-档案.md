# 0003_scheduled_tasks档案

## 一、这个迁移是干什么的

创建定时任务的两张表。定时任务功能需要持久化任务定义和每次运行的发生记录。

## 二、做了什么schema变更

- 创建`scheduled_tasks`表。定时任务定义。标题、prompt、schedule_type、schedule_spec、时区、状态、重叠策略、下次运行时间、上次运行信息、租约owner和过期时间。
- 创建`scheduled_task_runs`表。每次运行的发生记录。task_id、thread_id、run_id、scheduled_for、trigger、status、error、开始结束时间。

两张表各带状态、用户、thread、next_run_at等索引。

## 三、涉及哪些表

`scheduled_tasks`和`scheduled_task_runs`。

## 四、重要细节

幂等。表已存在时直接返回。防止create_all已建过表（比如旧的测试种子）被重复创建。

## 五、重要性评级

评级是7分。

理由。这两张表是定时任务功能的全部持久化基础。没有它们，定时任务就没有存储。
