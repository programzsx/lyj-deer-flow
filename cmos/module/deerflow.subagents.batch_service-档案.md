# deerflow.subagents.batch_service-档案

## 一、这个模块是干什么的

这个模块实现持久批处理子代理项的租约、执行、恢复。

一个batch_task工具调用可以提交多个子代理项。项持久化在数据库里。批处理服务轮询到期的项。租约声明。用SubagentExecutor执行。续租。写回结果。

崩溃恢复靠租约过期。worker崩溃后租约过期。另一个worker重新认领。同一个稳定项键。幂等。

这个模块是Gateway启动的常驻轮询服务。也是直接运行时可以持有的服务。

## 二、模块里的主要成员

### 1、_usage函数

这个函数把token用量记录求和成三个总数。input_tokens、output_tokens、total_tokens。

### 2、SubagentBatchService类

这是核心类。一个worker拥有一个代次。包括恢复的持久项。

构造参数有repository、config、runtime_config、app_config、execution_capacity、extensions。

extensions在构造时固定。一个worker拥有一个代次。包括恢复的持久项。注释强调不要把Python对象持久化进可序列化的execution_spec。

租约所有者是主机名加UUID。跨进程唯一。

内部状态有stop事件、轮询任务、执行任务字典、执行ID字典、项批次映射。

start方法启动轮询任务。

stop方法停止。先设stop事件。取消轮询任务。请求取消所有后台任务。取消所有执行任务。清理状态。

_run方法轮询循环。每次跑run_once。异常被隔离。间隔等待stop事件。

run_once方法按可用容量认领项。可用容量是max_running减当前执行数。认领的项创建执行任务。任务完成时从字典移除。

submit方法校验并创建批次。项数必须在1和max_items_per_batch之间。max_live和max_running的默认值处理有一个细节。注释解释了。用or会读显式0为"未设置"。替换成配置默认。隐藏调用者的值。范围守卫会失败。0是非对称情况。显式None才用默认。max_running不能超过max_live。

get_batch和cancel_batch代理到repository。cancel_batch还请求取消本地的执行任务。持久取消让另一个worker安全拥有HTTP控制请求。

_execute_item方法执行一个项。这是最核心的方法。

执行流程分几步。

第一步。从item里取batch、spec、config_data。prompt_overlay从JSON恢复。config_data转成SubagentConfig。

第二步。解析有效模型。离环组装工具。工具组装可能阻塞在MCP缓存初始化上。不能停在调用事件循环里。

第三步。重新验证持久状态再启动。cancel_batch可能在组装阻塞时终态化了这一项。租约也可能丢了。轮询循环的检查只在execute_async之后开始。不重新验证就会运行用户已取消的工作。租约无效就跳过启动。

第四步。构建SubagentExecutor。提示词带项键。提示幂等要求。用项键作为幂等身份。调用execute_async启动后台执行。

第五步。进入监控循环。每次轮询做几件事。取后台结果。RUNNING且没标过运行就标运行。标失败就取消。终态就跳出。到续租时间就续租。租约无效就取消。等待下一次轮询或停止事件。

第六步。终态后处理。admission_failure时重新入队。不消耗重试预算。结果截断到max_result_chars。预览截断到result_preview_max_chars。completed且有验收标准时跑验收检查。最后finalize_item写回。带结果、错误、stop_reason、token用量、模型名、验收结论。

异常时finalize失败。取消时requests取消。不finalize。持久租约过期。另一个worker重新认领同一个稳定项键。

_check_acceptance_with_lease方法保持完成的执行租约直到验收检查排干。检查任务被取消时。检查的沙箱卸载也排干。

## 三、它和谁协作

Gateway启动这个服务。SubagentRuntime也可以持有它。

它用SubagentExecutor执行项。用executor的execute_async、get_background_task_result、request_cancel_background_task、cleanup_background_task。

它通过repository做持久化。claim_items、create_batch、cancel_batch、renew_item_lease、mark_item_running、finalize_item、requeue_item_after_admission_failure。

它用batch_acceptance的check_batch_acceptance跑验收。

它用run_assembly离环组装工具。

## 四、重要性评级

评级是7分（满分10分）。

理由：

batch_service是持久批处理的执行引擎。轮询、租约、执行、恢复、验收、finalize都在这里。

租约管理很细。执行前重验证。租约丢了跳过启动。 RUNNING标记失败就取消。验收检查期间续租。崩溃恢复靠租约过期和稳定项键。

幂等提示写进每个项的提示词。让子代理知道可能被重试。

结果有界存储。截断和预览分开。

它是持久批处理的核心。复杂度高。给7分。
