# app.gateway.routers.scheduled_tasks-档案

源码路径是backend/app/gateway/routers/scheduled_tasks.py。

## 一、这个模块是干什么的

scheduled_tasks.py是定时任务路由。

定时任务让智能体按计划自动运行。

例如每天早上九点生成日报。

这个模块负责定时任务的CRUD和控制。

这个模块有500多行。

## 二、模块里的主要成员

路由前缀是/api。

### 1、端点列表

- POST "/scheduled-tasks/preview-cron"预览cron表达式。
- GET "/scheduled-tasks"列出任务。
- POST "/scheduled-tasks"创建任务。
- GET "/scheduled-tasks/{task_id}"读取任务。
- PATCH "/scheduled-tasks/{task_id}"修改任务。
- POST "/scheduled-tasks/{task_id}/pause"暂停任务。
- POST "/scheduled-tasks/{task_id}/resume"恢复任务。
- POST "/scheduled-tasks/{task_id}/trigger"立即触发任务。
- DELETE "/scheduled-tasks/{task_id}"删除任务。
- GET "/scheduled-tasks/{task_id}/runs"列出任务的运行。
- GET "/threads/{thread_id}/scheduled-tasks"列出线程关联的任务。

### 2、cron预览

preview-cron预览cron表达式的未来触发时间。

预览调用共享的调度计算器。

预览不预留执行。

用户配完cron先预览再保存。

### 3、任务控制

pause让任务暂停。

resume让任务恢复。

trigger立即触发一次。

删除任务会停掉未来的调度。

### 4、运行生命周期

定时运行是非交互的。

非交互运行不调用ask_clarification工具。

忙碌的触发持久化为queued状态。

任务运行历史可以查询。

## 三、它和谁协作

上游是前端的定时任务页面。

下游是app.scheduler的ScheduledTaskService。

服务是后台调度循环。

运行启动走app.gateway.services的launch_scheduled_thread_run。

配置来自config.yaml的scheduler段。

## 重要性评级

评级是7分。

理由如下。

定时任务是自动化的重要功能。

智能体可以无人值守按计划运行。

CRUD加控制的端点覆盖完整。

cron预览降低了配置门槛。

非交互语义是设计上的关键约束。

但定时任务是可选功能。

scheduler没开启时这个模块没有后台配合。

所以评级是7分。
