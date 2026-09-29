# deerflow.persistence.subagent_batches.sql-档案

## 一、这个模块是干什么的

这个模块是原生subagent批处理的SQL仓库。

仓库类叫SubagentBatchRepository。

这个模块读写subagent_batches和subagent_batch_items两张表。

这个模块管理批处理的创建、条目认领、条目完成、批处理控制。

条目用租约认领。

条目有验收裁决。

## 二、模块里的主要成员

### 1、SubagentBatchRepository类

这个类持有会话工厂。

这个类的方法覆盖批处理全生命周期。

#### （1）create_batch方法

create_batch创建批处理和条目。

条目从BatchItemInput构建。

提交键做幂等。

唯一约束冲突时IntegrityError被处理。

#### （2）get_batch方法和list_by_thread方法

get_batch取一个批处理。

带各状态条目计数。

list_by_thread列某线程的批处理。

#### （3）list_items方法

列出批处理的条目。

公共字段被限制。

结果字段默认不包含。

include_result为True时才带完整结果。

#### （4）claim_items方法

认领批处理条目。

认领遵守批处理的并发上限。

max_live_items和max_running_items限制在途条目数。

认领写租约。

认领用唯一约束防重复。

#### （5）renew_item_lease方法

续条目租约。

#### （6）mark_item_running方法

把条目标成running。

#### （7）finalize_item方法

完成一个条目。

终态是succeeded、failed、cancelled。

完成后刷新批处理状态。

#### （8）requeue_item_after_admission_failure方法

准入失败后条目重新排队。

#### （9）pause_batch、resume_batch、cancel_batch方法

暂停、恢复、取消批处理。

三个方法共用_set_control。

#### （10）_set_control方法

在行锁下设置批处理控制状态。

暂停和取消只作用于活跃批处理。

#### （11）retry_item方法

重试一个条目。

#### （12）_refresh_batch_status方法

刷新批处理状态。

根据条目计数推进批处理状态。

全部条目终态时批处理进入终态。

### 2、序列化辅助

_batch_dict和_execution_batch_dict序列化批处理行。

_item_dict序列化条目行。

公共字段集合控制暴露的字段。

时间戳字段用coerce_iso规范化。

## 三、它和谁协作

### 1、它依赖谁

它依赖subagent_batches/model.py的两个模型。

它依赖deerflow.subagents.acceptance_checks的AcceptanceVerdict。

它依赖deerflow.subagents.batch_runtime的BatchItemInput。

它依赖deerflow.subagents.report_contract的normalize_acceptance_criteria。

它依赖deerflow.utils.time的coerce_iso。

### 2、谁依赖它

subagent批处理运行时用它创建和执行批处理。

Gateway的批处理查询通过它读状态。

## 四、重要性评级

评级是6分。

理由如下。

原生subagent批处理的全部持久化逻辑在这里。

条目租约认领遵守批处理的并发上限。

验收裁决的规范化在这里接入。

扣分的原因是批处理是较新的功能。

它只服务批处理一条链路。

核心subagent执行另有独立的持久化。
