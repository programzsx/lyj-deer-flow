# app.subagent_batches包档案

## 一、这个模块是干什么的

app.subagent_batches包是应用层子代理批次服务的包门面。

源文件是backend/app/subagent_batches/__init__.py。

文件极小。

它只有一条导入语句加一个__all__。

它的角色是单成员跨包门面。

注意它导入的不是本包内的模块。

它导入的是harness包里的类。

这一点是它与其他app系薄门面的最大区别。

它没有懒加载。

它没有docstring。

## 二、模块里的主要成员

它只导入一个成员。

成员是SubagentBatchService。

SubagentBatchService来自deerflow.subagents.batch_service模块。

这个类不在app包里。

这个类在backend/packages/harness/deerflow/subagents/下。

app.subagent_batches目录本身没有service.py。

这个目录只是应用层给这个服务预留的入口位。

SubagentBatchService在__all__里声明。

## 三、它和谁协作

它向上被网关的subagent_batches路由使用。

路由通过SubagentBatchService管理子代理批次。

它与deerflow.persistence.subagent_batches协作。

持久层提供SubagentBatchRow、SubagentBatchItemRow和SubagentBatchRepository。

它依赖deerflow.subagents包。

那个包提供批次服务的全部执行逻辑。

app包在这里只做了入口转发。

## 四、重要性评级

评级是4分。

理由如下。

它是子代理批次功能在应用层的正式入口。

调用方不需要知道实现其实在harness包里。

这个转发让应用层的导入路径保持统一风格。

统一风格是app.mcp_tasks、app.scheduler、app.subagent_batches三个包共同维持的。

扣分点在于它几乎零内容。

它只是给harness里的类起了一个应用层别名。

复杂度完全在harness层和持久层。
