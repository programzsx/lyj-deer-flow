# deerflow.persistence.mcp_tasks包档案

## 一、这个模块是干什么的

deerflow.persistence.mcp_tasks包是MCP任务持久化的包门面。

源文件是backend/packages/harness/deerflow/persistence/mcp_tasks/__init__.py。

它的角色是立即导入式薄门面。

它把MCP任务持久化的ORM模型和SQL仓库一次性导入并暴露。

它没有懒加载。

它没有docstring。

它的价值在__all__清单上。

清单覆盖了模型、仓库和两个错误类型。

## 二、模块里的主要成员

它从两个模块导入成员。

model模块提供McpTaskRow。

McpTaskRow是MCP任务的ORM行模型。

sql模块提供三个成员。

成员是McpTaskRepository、DuplicateMcpRemoteTaskError、McpTaskThreadMismatchError。

McpTaskRepository是任务仓库。

DuplicateMcpRemoteTaskError表示重复的远端任务错误。

McpTaskThreadMismatchError表示任务与线程不匹配错误。

四个成员在__all__里。

两个错误类型是任务查询的防串线保障。

## 三、它和谁协作

它向内聚合model和sql两个模块。

它向上被app.mcp_tasks服务和网关路由消费。

服务通过这个仓库查询和轮转任务。

它与deerflow.persistence.engine协作。

仓库需要会话工厂。

它与deerflow.mcp.tasks协作。

harness层的任务驱动器产出这里的行数据。

它还被deerflow.persistence.models引用。

models子包把McpTaskRow注册进Base.metadata。

## 四、重要性评级

评级是5分。

理由如下。

它是MCP任务持久化的正式入口。

仓库加两个错误类型的成套暴露让调用方一次导入即可。

两个错误类型是跨线程取任务的防线。

它参与models子包的ORM注册链条。

扣分点在于它没有docstring。

内容较少。

复杂度在sql模块里。
