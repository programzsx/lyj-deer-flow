# app.mcp_tasks包档案

源码路径是backend/app/mcp_tasks/__init__.py。

## 一、这个包是干什么的

这个包是MCP长任务服务。

有些MCP工具的运行时间很长。

长时间轮询远程任务不能占着智能体的循环。

这个包把长任务移出智能体循环。

智能体只做提交。

提交之后数据库是事实来源。

智能体循环里只保留一个有界的当前线程投影。

McpTaskService负责持久化和轮询这些长任务。

服务支持租约恢复。

服务支持取消。

服务支持通知投递。

## 二、包里的主要成员

### 1、__init__.py

__init__.py导出McpTaskService。

只有一行实质性导入。

### 2、service.py

service.py是包的主体。

service.py有1500多行。

McpTaskService类的职责是持久化和轮询智能体循环之外的长运行MCP任务。

构造参数包含repository、drivers、poll_interval_seconds、lease_seconds、max_concurrent_polls等。

drivers是McpTaskDriverRegistry，注册了不同协议的任务驱动。

service.py定义了几个内部状态结构。

_BatchRecordState记录批次记录状态和释放任务。

_BatchState记录取消请求。

_ClaimOwner记录认领任务和交接任务。

_current_batch_record是ContextVar，记录当前批次的记录状态。

关键行为如下。

- 提交任务时写入数据库。
- 后台轮询器按间隔轮询远程任务状态。
- 轮询有租约。租约过期后其他实例可以接管。
- 并发轮询数量有上限。
- 轮询失败有退避。backoff上限默认300秒。
- 输入所需的任务用单独的60秒轮询间隔。
- 连续多次错误后进入降级追踪。
- 结果有大小上限，默认65536字节。预览有字符上限，默认2000字符。
- 任务完成或失败时投递通知。通知用内部Agent运行投递。
- 通知有重试，最多5次。
- 永久通知错误进死信。
- 取消有栅栏。取消请求先持久化，再由轮询器确认。
- 取消后等待最多5秒排水。

### 3、errors.py

errors.py定义PermanentNotificationError。

这个错误表示通知在没有外部状态改变的情况下永远无法投递。

## 三、它和谁协作

上游有两类调用方。

一类是harness层的MCP工具。

工具只做提交，提交后立即返回任务引用。

一类是Gateway。

app.py在lifespan里启动McpTaskService。

routers/mcp_tasks.py用deps.py的get_mcp_task_service暴露查询API。

下游是harness层。

服务依赖deerflow.mcp.tasks的任务驱动和类型。

服务依赖deerflow.persistence.mcp_tasks的持久化。

服务依赖deerflow.runtime的取消和运行管理。

通知投递复用Gateway的内部运行路径launch_mcp_task_notification_run。

## 重要性评级

评级是6分。

理由如下。

MCP长任务是产品的一个进阶能力。

普通的短MCP调用不经过这个包。

只有长运行的远程任务才需要这个服务。

这个服务的价值在于把轮询移出智能体循环。

智能体循环不再被长任务阻塞。

数据库作为事实来源，任务在网关重启后可以恢复。

租约机制支持多实例。

删除这个包，长MCP任务功能失效。

但普通的MCP工具调用、智能体运行、聊天都不受影响。

所以评级是6分。

这个包被app.py、deps.py、routers/mcp_tasks.py引用。

不在所有请求的核心路径上。
