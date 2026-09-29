# ScheduledTaskAdmissionRejected-档案

## 一、这个类是干什么的

ScheduledTaskAdmissionRejected是persistence/scheduled_task_runs/sql.py里的异常类。

它继承Exception。

它表示parent task在queue admission之前改变或消失。

这个类位于backend/packages/harness/deerflow/persistence/scheduled_task_runs/sql.py。

## 二、类的成员（字段，各自做什么）

### 1、字段

task_id是admission被拒绝的task id。

reason是拒绝原因。

### 2、消息格式

消息是"scheduled task {task_id!r} admission rejected: {reason}"。

### 3、语义

parent task在queue admission之前改变或消失时抛出。

PATCH、pause、delete会改变任务定义。

admission在parent task锁内检查。

## 三、它和谁协作

- ScheduledTaskRunRepository的claim抛它。
- scheduler服务捕获它。

## 四、重要性评级

评级是3分。

理由如下。

这个类是admission拒绝的信号。

带task_id和reason。

fail-loud。parent task变化时不静默插入。

扣掉7分。

扣分原因是它是小异常类。
