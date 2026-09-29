# McpTaskService-档案

## 一、这个类是干什么的

McpTaskService是app/mcp_tasks/service.py里的类。

这个类是MCP长任务的持久化和轮询服务。

它在Agent循环之外持久化和轮询长时间运行的MCP任务。

核心职责如下。

通过driver提交任务并持久化远程句柄。

按租约轮询远程状态。

处理取消请求。

重试通知。

dead-letter永久失败的通知。

数据库是唯一事实来源。

这个类位于backend/app/mcp_tasks/service.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、构造方法

构造方法接受repository、drivers、轮询间隔、租约秒数、最大并发轮询、轮询退避、input_required轮询间隔、降级阈值、最大结果字节、预览字符上限、launch_notification回调、get_run回调。

### 2、submit方法

这个方法通过一个driver提交并持久化远程句柄。

流程如下。

第一步按名字取driver。没有注册时抛LookupError。

第二步生成local_task_id。

第三步driver.submit提交。

第四步构造TaskReference。

第五步规范化快照、计算下次轮询、写入repository。

错误处理分三种。

DuplicateMcpRemoteTaskError时直接抛。这个句柄已有持久所有者。取消补偿会终止已跟踪的旧任务。

CancelledError时取消未跟踪的远程任务作为补偿。取消可以和成功的数据库提交竞争。补偿比留一个活的未跟踪远程任务更安全。

其他异常时同样取消补偿。

补偿任务带名字。完成后丢弃并记录失败。

### 3、run_once方法

这是一次轮询循环。

流程如下。

第一步运行取消处理。

第二步claim到期的任务。claim带取消释放。

第三步对claim到的批次逐个轮询。

意外失败时租约过期让恢复接管。

第四步运行通知处理。

### 4、_poll_one_claimed方法

这个方法轮询一个claim到的任务。

driver不存在时释放并报错。

McpTaskProtocolError时契约永久失败。任务标记为FAILED。

其他异常时警告并退避重试。

成功时应用快照。

### 5、_apply_snapshot方法

这个方法把快照应用到repository。

租约所有权变化或过期时丢弃轮询结果。

### 6、_next_poll_at方法

这个方法计算下次轮询时间。

不可轮询的返回None。

INPUT_REQUIRED状态用更长的间隔。

间隔封顶在86400秒。

### 7、_release_after_error方法

这个方法在错误后释放claim。

重试退避用指数计算。

封顶在max_poll_backoff_seconds。

连续错误超过阈值时标记tracking降级。

### 8、取消路径

cancel_task记录取消请求。

cancel_matching_task按名字或id匹配。多个匹配时要求指定名字。

取消claim带取消释放。

释放路径包括ordinary batch、cancellation、notification failure、cancel_after、poll_after。

### 9、通知路径

_run_notifications处理到期通知。

通知最多重试5次。

永久失败走dead-letter。

通知完成时间不会早于claim时间。

### 10、_BatchRecordState和_ClaimOwner

这是内部状态数据类。

_BatchRecordState跟踪batch记录和释放任务。

_ClaimOwner持有claim任务和交接任务。

### 11、start和stop方法

start启动轮询器。

stop停止并等待。停止超时打日志。

### 12、内部细节

错误消息持久化截断到4000字符。

input_required载荷上限65536字节。

claim交接处理取消期间的释放。

## 三、它和谁协作

- deerflow.mcp.tasks的driver和模型。
- persistence/mcp_tasks的repository。
- PermanentNotificationError标记永久通知失败。
- run manager的ConflictError。
- cancellation模块的wait_for_task_until。

## 四、重要性评级

评级是9分。

理由如下。

这个类是MCP长任务运行时的服务核心。

它把远程任务的状态移出Agent循环。

数据库是唯一事实来源。

它处理了租约、取消补偿、通知重试、dead-letter。

每个取消路径都有释放配对。

取消和数据库提交的竞争用补偿处理。

契约永久失败和暂时失败分开。

这些都是长任务可靠性的关键。

扣掉1分。

扣分原因是部分状态管理依赖repository层。
