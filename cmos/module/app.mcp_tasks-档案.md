# app.mcp_tasks包档案

## 一、这个模块是干什么的

app.mcp_tasks包是应用层MCP任务服务的包门面。

源文件是backend/app/mcp_tasks/__init__.py。

文件极小。

它只有一条导入语句加一个__all__。

它的角色是单成员门面。

它把服务类直接暴露出去。

它没有懒加载。

它没有docstring。

它导入的对象很轻。

轻量导入不需要懒加载保护。

## 二、模块里的主要成员

它只导入一个成员。

成员是McpTaskService。

McpTaskService来自app.mcp_tasks.service模块。

McpTaskService在__all__里声明。

这个包的全部公共面就是这一个类。

包内其他细节都在service.py一个文件里。

这个包是单文件包加薄门面的组合。

## 三、它和谁协作

它向内依赖service模块。

它向外被网关的路由层使用。

网关通过McpTaskService管理MCP任务的查询和轮转。

它与deerflow.persistence.mcp_tasks协作。

持久层提供McpTaskRow和McpTaskRepository。

它与deerflow.mcp.tasks协作。

harness层提供任务驱动器和任务状态模型。

服务类是应用层对这两个底层的粘合点。

## 四、重要性评级

评级是4分。

理由如下。

它是MCP任务功能在应用层的正式入口。

调用方写from app.mcp_tasks import McpTaskService即可。

不需要关心service.py这个内部细节。

这种门面隔离让service.py的重构不影响调用方。

扣分点在于包本身很小。

功能单一。

复杂度都在底层协作模块里。
