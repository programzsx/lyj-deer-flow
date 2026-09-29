# SubagentBatchService档案

源码位置：backend/packages/harness/deerflow/subagents/batch_service.py

## 一、这个类是干什么的

SubagentBatchService是持久批处理的服务。

batch_task模式的委派是持久的。持久批处理走数据库。这个服务负责租约、执行、恢复持久原生子Agent批处理条目。

SubagentBatchService的职责有这些。

第一。轮询。服务跑一个后台轮询任务。轮询按配置的间隔周期性执行run_once。

第二。领取条目。run_once按可用容量领取条目。领取带租约。租约有owner和时长。租约让多实例部署安全。

第三。执行条目。领取的条目变成异步任务。任务用SubagentExecutor执行。

第四。提交。submit接收BatchSubmitRequest。校验条目数、max_live、max_running。条目持久化进数据库。

第五。恢复。租约过期的条目可以被重新领取。恢复用同一个执行器。

第六。停止。stop设置停止事件。取消轮询。请求取消所有执行。取消所有任务。清空注册表。

## 二、类的成员

（一）字段

- _repository：持久存储仓库。
- _config：批处理配置。
- _runtime_config：运行时配置。
- _execution_capacity：执行容量控制器。
- _extensions：扩展快照。一个worker拥有一代扩展。
- _lease_owner：租约所有者。主机名加uuid。
- _poller：轮询任务。
- _executions：条目id到执行任务的映射。
- _execution_ids：条目id到执行器id的映射。

（二）方法

- start：启动轮询任务。幂等。
- stop：停止轮询和所有执行。
- run_once：一轮调度。领取条目。启动执行。
- submit：提交一次批处理。校验后持久化。

## 三、它和谁协作

（一）上游

task工具通过SubagentBatchSubmitter桥提交。SubagentRuntime拥有这个服务。

（二）执行器

SubagentBatchService用SubagentExecutor执行条目。执行共享进程slot。

（三）验收

SubagentBatchService用check_batch_acceptance检查已完成条目的验收标准。

## 四、重要性评级

评级：8分。

理由：SubagentBatchService是持久批处理的执行中枢。它把批处理委派从内存变成数据库持久化。租约机制支持多实例部署和故障恢复。它是subagents目录里的核心类之一。给8分。
