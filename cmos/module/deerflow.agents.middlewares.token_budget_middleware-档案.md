# deerflow.agents.middlewares.token_budget_middleware档案

源码路径是backend/packages/harness/deerflow/agents/middlewares/token_budget_middleware.py。

## 一、这个中间件是干什么的

这个中间件强制执行每次运行的token预算上限。

一次智能体运行会调用很多次模型。

每次调用都消耗token。

token消耗可能失控。

这个中间件跟踪一次运行内的累计token用量。

累计口径有输入token、输出token、总token三个。

这个中间件提供两个阈值。

第一个是软警告阈值。

用量超过软警告阈值时向模型注入警告。

第二个是硬停止阈值。

用量超过硬停止阈值时剥掉工具调用。

剥掉工具调用后智能体循环自然终止。

模型用已收集的结果给出最终回答。

这个中间件不抛异常。

这个中间件用自然方式结束循环。

配置由TokenBudgetConfig提供。

token_budget.enabled关闭时全部逻辑直接跳过。

## 二、模块里的主要成员

### 1、TokenUsage数据类

TokenUsage是用量数据结构。

TokenUsage有三个字段。

input是输入token累计。

output是输出token累计。

total是总token累计。

### 2、TokenBudgetMiddleware类

TokenBudgetMiddleware是这个中间件的核心类。

这个类继承AgentMiddleware。

构造函数接收TokenBudgetConfig。

构造函数初始化六个有界字典。

所有字典都用BoundedDict。

BoundedDict防止放弃的运行导致无限增长。

所有字典容量都是1000。

_warned记录每个run是否已发警告。

_pending_warnings存待注入的警告文本。

_seen_messages记录每条消息已计入的token。

_cumulative_usage记录每个run的累计用量。

_stop_reason记录硬停止的停止原因。

_fallback_run_ids存没有run_id时的回退键。

全部状态用threading.Lock保护。

from_config类方法从配置构造实例。

reset方法清空全部状态。

### 3、run_id解析

_get_run_id方法解析运行身份。

优先从runtime.context取run_id。

同一个Gateway运行可能为了隐藏的目标延续重新进入图。

延续共享同一个run_id。

延续共享同一个预算。

context里没有非空字符串run_id时用回退键。

回退锚点是Runtime.control。

id(runtime)从一个图节点到下一个会变。

Runtime.control不会变。

Runtime.control也不存在时用runtime本身。

回退键是"__invocation__:"加随机uuid。

键是生成的token不是对象地址。

对象地址在对象被回收后可能被复用。

release_policy_parameters方法声明配置参数。

这个方法返回配置的完整dump。

这是行为自描述机制的组成部分。

### 4、用量统计

before_agent钩子做初始化。

before_agent把历史消息全部标记为已见。

历史消息属于之前的运行。

已见标记让历史消息不计入本次运行预算。

seen映射记录每条消息的输入输出token。

after_agent钩子做清理。

有显式run_id时只清seen映射。

用量和警告状态保留。

因为目标延续共享同一个run_id的预算。

延续结束后before_agent会重建seen映射。

没有显式run_id时清空全部状态。

没有run_id的调用预算是每次调用的。

### 5、预算应用

_apply方法是预算判断的核心。

after_model和aafter_model都调用_apply。

_apply的逻辑分五步。

第一步遍历全部消息的usage_metadata。

用seen映射对比每条消息之前记录的值。

算出新增的输入输出token差值。

新增token累加进usage_accum。

差值计算能自然捕获子智能体的token。

TokenUsageMiddleware会把子智能体用量回填到消息历史。

第二步构造比对分数。

total总是参与比对。

配置了max_input_tokens时input参与比对。

配置了max_output_tokens时output参与比对。

第三步找最高的占比。

占比是用量除以对应上限。

第四步判断硬停止。

最高占比超过hard_stop_threshold就硬停止。

硬停止记录停止原因到_stop_reason字典。

停止原因键按runtime.context的run_id原样记录。

None也包括在内。

执行器拿原始run_id来消费。

硬停止还把stop_reason写进runtime.context。

写进context让lead worker不用引用中间件实例也能读到。

硬停止用clone_ai_message_with_tool_calls克隆消息。

克隆把工具调用剥成空列表。

克隆在content后面追加超限说明文本。

硬停止返回状态更新。

第五步判断软警告。

最高占比超过warn_threshold且还没警告过。

警告文本格式化进_pending_warnings。

警告在下次wrap_model_call时注入。

### 6、警告注入

wrap_model_call钩子做警告注入。

_drain_pending_warnings方法取走待注入警告。

_inject_warnings方法把警告注入请求。

警告用HumanMessage承载。

警告消息的name是budget_warning。

警告消息追加到消息列表末尾。

注入不改动图状态。

注入保留AIMessage和ToolMessage的配对。

调用抛异常时_restore_pending_warnings把警告放回去。

LLMErrorHandlingMiddleware在这个中间件外面重试失败的调用。

重试必须还能找到警告。

警告不会排队两次。

因为_warned已经置位。

### 7、consume_stop_reason方法

consume_stop_reason方法消费停止原因。

这个方法弹出并返回本run的停止原因。

硬停止触发时返回"token_capped"。

否则返回None。

子智能体执行器在run返回后调用这个方法。

执行器据此区分预算封顶的完成和干净完成。

这个字典故意不被after_agent清理。

执行器要在run返回之后才能读。

有界字典防止放弃的运行泄漏。

## 三、它和谁协作

这个中间件在中间件链的尾部守卫区。

装配顺序排第33位。

配置开关是token_budget.enabled。

这个中间件和TokenUsageMiddleware协作。

TokenUsageMiddleware把子智能体用量回填进消息历史。

这个中间件靠差值统计自动捕获这些回填。

这个中间件和LLMErrorHandlingMiddleware协作。

错误处理中间件重试失败调用时警告要能恢复。

这个中间件和tool_call_metadata协作。

硬停止用clone_ai_message_with_tool_calls剥工具调用。

这个中间件的stop_reason被子智能体执行器消费。

执行器把token_capped上报给lead。

stop_reason也写进runtime.context供lead worker读取。

## 重要性评级

评级是7分。

理由如下。

token预算是成本和安全的双重护栏。

失控的运行会烧掉大量token。

失控的运行可能撑爆模型上下文。

硬停止机制保证了运行有界。

子智能体token的捕获设计很关键。

没有差值统计子智能体的消耗会漏算。

run_id键控保证了目标延续共享预算。

不评8分以上的原因是这个中间件是可选功能。

token_budget.enabled关闭时完全不存在。

正常运行很少触发阈值。

所以评级是7分。
