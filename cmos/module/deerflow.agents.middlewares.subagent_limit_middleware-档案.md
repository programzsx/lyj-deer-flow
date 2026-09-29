# deerflow.agents.middlewares.subagent_limit_middleware档案

源码路径是backend/packages/harness/deerflow/agents/middlewares/subagent_limit_middleware.py。

## 一、这个中间件是干什么的

这个中间件负责强制执行子智能体工具调用上限。

DeerFlow允许主智能体通过task工具把工作委派给子智能体。

大语言模型有时会在一次回复里生成过多的task调用。

提示词层面的限制不可靠。

模型可能不听。

这个中间件用代码强制截断多余的task调用。

这个中间件执行两类上限。

第一类是单次回复的并发上限max_concurrent。

一次回复里的task调用数不能超过这个值。

第二类是整轮运行的总上限max_total。

一轮运行里的委派总数不能超过这个值。

总上限靠持久化委派账本计算。

账本条目带run_id标记。

这样一轮运行里的重复规划检查点不能无限发起合法大小的批次。

同一个线程的后续用户轮次会拿到新的运行预算。

截断发生时中间件会附加一条可见的限制提示。

这样运行可以用已有的子智能体结果继续收尾。

不会以空的工具调用响应结束。

## 二、模块里的主要成员

### 1、常量

MIN_SUBAGENT_LIMIT和MAX_SUBAGENT_LIMIT是并发上限的安全范围。

并发上限的安全范围来自MIN_CONCURRENT_SUBAGENT_CALLS和MAX_CONCURRENT_SUBAGENT_CALLS。

范围是1到64。

DEFAULT_MAX_TOTAL_SUBAGENTS是每轮总上限的默认值，来自DEFAULT_MAX_TOTAL_SUBAGENTS_PER_RUN，默认是6。

MIN_SUBAGENT_TOTAL_LIMIT和MAX_SUBAGENT_TOTAL_LIMIT是总上限的范围，是1到50。

_TOTAL_LIMIT_STOP_MSG是总上限耗尽时附加的提示文本。

提示文本告诉模型三件事。

用已收集的子智能体结果继续。

直接执行剩余的简单工作。

总结剩余工作而不是再发起子智能体。

### 2、SubagentLimitMiddleware类

这个类继承AgentMiddleware。

构造函数接收两个参数。

max_concurrent是并发上限，默认是MAX_CONCURRENT_SUBAGENTS，即3。

调用方传入的值已经按进程执行容量做过钳制。

构造时再用_clamp_subagent_limit钳制一遍。

max_total是总上限，默认是6。

构造时用_clamp_total_subagent_limit钳制到1到50。

release_policy_parameters返回这两个值。

这个方法用于发布身份，是行为可配置中间件的自我描述。

### 3、辅助函数

_clamp_subagent_limit把并发上限钳制到1到64。

_clamp_total_subagent_limit把总上限钳制到有界正数范围。

两个钳制函数都委托给subagents_config的实现。

_append_text把提示文本追加到消息内容上。

内容可能是None、字符串或列表。

None就返回提示文本。

字符串就拼接。

列表就追加一个text块。

_delegation_id从账本条目取id。

_delegation_run_id从账本条目取run_id。

_runtime_run_id从运行时上下文取run_id。

### 4、_count_prior_delegations

这个函数统计之前的委派数量。

输入是ThreadState的delegations账本。

run_id存在时只统计run_id匹配的条目。

去重按id。

run_id为None时不做run_id过滤。

这种情况会保守地统计整个线程的账本。

这是fail-restrictive方向。

宁可少放行，不超发。

### 5、_truncate_task_calls

这个方法是截断逻辑的核心。

这个方法的流程如下。

第一步取最后的消息。

最后一条消息必须是AI消息。

不是就返回None。

第二步取tool_calls。

没有task调用就返回None。

第三步取运行时的run_id。

run_id不存在会记录警告。

警告提醒调用方在运行时上下文里传run_id。

第四步统计之前的委派数量。

第五步计算剩余总配额。

remaining_total等于max_total减去已有委派数。

允许的task调用数取并发上限和剩余总配额的较小值。

第六步判断是否超限。

task调用数不超过允许值就返回None。

第七步执行截断。

超出允许值的task调用会被丢弃。

保留的是前面的调用。

丢弃时会记录警告日志。

第八步处理总上限耗尽。

remaining_total等于0时在运行时上下文盖章stop_reason为subagent_limit_capped。

这样worker会把这次截断式完成和loop_capped、token_capped、safety_capped并列展示。

第九步构建截断后的AI消息。

remaining_total等于0时在内容上附加_TOTAL_LIMIT_STOP_MSG提示。

消息替换用clone_ai_message_with_tool_calls。

相同的id会触发状态里的消息替换。

返回值是包含更新消息的状态字典。

### 6、after_model和aafter_model

两个钩子都直接调用_truncate_task_calls。

after_model在模型响应之后运行。

aafter_model是异步版本。

截断发生在模型生成之后、工具执行之前。

被截断的task调用不会被执行。

## 三、它和谁协作

在中间件链里这个中间件属于lead专属段。

装配顺序在共享运行时基础段之后。

这个中间件是可选的。

subagent_enabled开启时才装配。

这个中间件依赖ThreadState的delegations账本。

账本由DurableContextMiddleware在task分发时捕获。

条目带run_id和id。

这个中间件依赖subagents_config的钳制函数和常量。

依赖subagents.executor的MAX_CONCURRENT_SUBAGENTS默认值。

依赖tool_call_metadata的clone_ai_message_with_tool_calls。

用克隆消息替换而不是裸更新tool_calls。

这一步避免适配器重发陈旧的content工具调用块。

lead_agent的build_middlewares负责构造这个中间件。

max_concurrent按启动时的subagent_runtime.max_running解析后再传入。

运行时上下文提供run_id。

Gateway和DeerFlowClient的stream总是提供run_id。

自定义图集成也必须提供。

上游是模型的响应。

下游是task工具的执行。

## 重要性评级

评级是7分。

理由如下。

子智能体委派消耗真实的执行资源。

没有这个中间件，模型可以在一次回复里发起几十个task调用。

这会压垮进程执行容量。

没有这个中间件，一轮运行可以无限发起批次。

资源保护靠提示词不可靠。

代码级强制是唯一可靠的手段。

总上限用run_id标记的持久化账本计算。

设计考虑了重复规划检查点的绕过路径。

run_id缺失时保守地按全线程账本统计。

这是fail-restrictive方向。

截断后附加可见提示让运行能体面收尾。

stop_reason盖章让截断式完成可观测。

所以评级是7分。

不评8分以上的原因是这个中间件是可选件。

subagent_enabled关闭时整个中间件不存在。

不使用子智能体的部署删掉它没有任何影响。
