# app.scheduler包档案

## 一、这个模块是干什么的

app.scheduler包是应用层定时任务服务的包门面。

源文件是backend/app/scheduler/__init__.py。

文件极小。

它只有一条导入语句加一个__all__。

它的角色是单成员门面。

它没有懒加载。

它没有docstring。

它导入的对象很轻。

轻量导入不需要懒加载保护。

## 二、模块里的主要成员

它只导入一个成员。

成员是ScheduledTaskService。

ScheduledTaskService来自本包的service模块。

注意导入写法是相对导入from .service import。

这一点与app.mcp_tasks的绝对导入写法不同。

ScheduledTaskService在__all__里声明。

这个包的全部公共面就是这一个类。

## 三、它和谁协作

它向内依赖service模块。

它向外被网关的scheduled_tasks路由使用。

路由通过ScheduledTaskService创建、查询、删除定时任务。

它与deerflow.persistence.scheduled_tasks协作。

持久层提供ScheduledTaskRow和ScheduledTaskRepository。

它与deerflow.persistence.scheduled_task_runs协作。

持久层提供定时任务运行记录的 admission 控制。

它与deerflow.scheduler协作。

harness层提供cron表达式解析和下次运行时间计算。

服务类是应用层对这些底层的粘合点。

## 四、重要性评级

评级是4分。

理由如下。

它是定时任务功能在应用层的正式入口。

调用方写from app.scheduler import ScheduledTaskService即可。

不需要关心service.py这个内部细节。

这种门面隔离让service.py的重构不影响调用方。

扣分点在于包本身很小。

功能单一。

复杂度在持久层和harness层。
