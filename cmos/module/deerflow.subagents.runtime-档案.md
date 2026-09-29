# deerflow.subagents.runtime-档案

## 一、这个模块是干什么的

这个模块定义直接调用create_deerflow_agent时的显式运行时依赖。

Gateway和嵌入式入口在启动时安装等效的进程全局依赖。直接图工厂改为显式接收这个对象。这样多个图可以共享一个真实执行上限。提供app_config也让子代理注册表、模型、工具解析保持同一个调用方拥有的快照。

提供batch_repository时运行时拥有一个持久批处理worker。构造图之前启动。应用关机时停止。

## 二、模块里的主要成员

模块只有一个类。

### 1、SubagentRuntime类

这个类共享原生子代理容量和可选的持久批处理。跨图。

构造参数有config、max_total_per_run、batch_submitter、batch_repository、batch_config、app_config。

构造函数做校验。max_total_per_run必须在配置的最小值和最大值之间。batch_submitter和batch_repository不能同时给。batch_repository需要batch_config.enabled=true。batch_repository需要显式app_config快照。batch_config需要batch_repository。

构造函数深拷贝配置。创建execution_capacity。创建可选的owned批处理服务。创建生命周期锁。

from_app_config类方法从调用方拥有的配置快照构建。从app_config读subagent_runtime配置和max_total_per_run。有batch_repository时读subagent_batches配置。

batch_submitter属性返回提交者。外部传入的优先。有owned服务且已启动时返回owned服务。否则返回None。

start方法启动owned批处理worker。没配置直接返回。生命周期锁保护。已启动直接返回。await service.start()。标记已启动。

stop方法停止owned worker。生命周期锁保护。先隐藏submitter。创建停止任务。等待任务完成。caller取消被记下。任务失败时取消链。任务结果检查。stop方法的排空故意没有超时。释放生命周期所有权时服务还在停止的话。工作会活过这个运行时。所以没有超时。owned服务的stop必须终止。

支持async with。__aenter__调用start。__aexit__调用stop。

## 三、它和谁协作

create_deerflow_agent的调用方传入SubagentRuntime。多个图共享一个执行上限。

SubagentExecutionCapacity被构造和共享。

SubagentBatchService在batch_repository存在时被构造。start和stop控制它的生命周期。

batch_runtime的SubagentBatchSubmitter是提交者协议。

batch_service的SubagentBatchService是owned服务。

它依赖config的SubagentRuntimeConfig、SubagentBatchesConfig、subagents_config。

## 四、重要性评级

评级是5分（满分10分）。

理由：

SubagentRuntime是直接图工厂的显式依赖容器。多个图共享一个真实执行上限。不依赖进程全局状态。

stop方法的排空没有超时。注释解释了原因。释放生命周期所有权时服务还在停止的话工作会活过运行时。这是对的。

批处理配置的相互校验细。submitter和repository互斥。repository需要enabled配置。repository需要app_config。

它影响直接图工厂的使用场景。Gateway路径不用它。Gateway用进程全局依赖。

它是嵌入场景的基础设施。给5分。
