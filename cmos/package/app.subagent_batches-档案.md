# app.subagent_batches包档案

源码路径是backend/app/subagent_batches/__init__.py。

## 一、这个包是干什么的

这个包是子智能体批处理服务。

用户有时要把同一个任务批量跑很多次。

比如批量处理100个文件。

比如批量做100次翻译。

一次一个太慢。

这个包把批量任务持久化。

持久化后由后台worker逐项执行。

批处理支持租约、恢复、暂停、取消、重试。

这个包本身是一层薄封装。

实际实现在harness层的batch_service里。

app.subagent_batches只是把deerflow.subagents.batch_service.SubagentBatchService重新导出。

## 二、包里的主要成员

### 1、__init__.py

__init__.py只有一行实质性导入。

__init__.py从deerflow.subagents.batch_service导入SubagentBatchService。

__init__.py导出SubagentBatchService。

### 2、deerflow.subagents.batch_service

这是实际的实现。

位于packages/harness/deerflow/subagents/batch_service.py。

SubagentBatchService的职责是租约、执行、恢复持久的原生子智能体批处理条目。

构造参数包含repository、config、runtime_config、app_config、execution_capacity、extensions。

repository是批处理的持久化仓库。

config是SubagentBatchesConfig。

runtime_config是SubagentRuntimeConfig。

execution_capacity是子智能体执行容量。

extensions是已加载的扩展。

关键方法如下。

- start启动worker。
- stop停止worker。
- run_once执行一轮扫描。
- submit提交批处理请求。返回批次信息。
- get_batch查批次。
- cancel_batch取消批次。
- _execute_item执行单个条目。
- _check_acceptance_with_lease带租约做验收检查。

一个worker拥有一个世代。

世代包括恢复的持久条目。

这个Python对象绝不持久化到可序列化的execution_spec里。

条目状态有7种。

状态是pending、queued、leased、running、succeeded、failed、cancelled。

worker执行条目时用SubagentExecutor。

执行结果聚合令牌用量。

## 三、它和谁协作

上游是Gateway。

app.py在lifespan里启动SubagentBatchService。

app.py把subagent_batches_available状态挂到app.state。

routers/subagent_batches.py用deps.py的get_subagent_batch_service暴露控制API。

下游是harness层。

实际实现完全在deerflow.subagents.batch_service。

服务依赖deerflow.persistence的批处理仓库。

服务依赖deerflow.subagents.executor执行子智能体。

服务依赖deerflow.extensions获取已加载扩展。

批处理的查询和控制走routers/subagent_batches.py。

控制端点有pause、resume、cancel、retry。

worker不在运行时cancel端点返回503。

## 重要性评级

评级是5分。

理由如下。

子智能体批处理是一个进阶功能。

普通聊天和单次任务不经过这个包。

只有批量并行执行才需要它。

这个包本身只是薄封装，实际实现全在harness层。

删除这个包里的__init__.py等于删除一个转发层。

harness层的SubagentBatchService仍然存在。

但app层的启动和API接线会断。

批处理功能失效。

所以评级是5分。

这个包被app.py、deps.py、routers/subagent_batches.py引用。

不在核心路径上。

功能本身依赖配置开启。
