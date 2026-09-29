# deerflow.subagents.step_events-档案

## 一、这个模块是干什么的

这个模块构建紧凑的子代理步骤载荷。用于流式推送和持久化。对应issue #3779。

子代理（子任务）的执行步骤以前只在最新流帧里可见。从不持久化。用户刷新后看不到子代理跑了什么工具、每步产出了什么。

这个模块是纯数据塑形层。它把捕获的子代理消息字典转换成小的、可JSON序列化的步骤载荷。载荷有两个去向。一个是task_running自定义事件里流式推送。一个是subagent.step运行事件持久化。

保持纯函数意味着不需要起图就能单元测试。流式和持久化两个调用点共享一个"步骤"定义。

## 二、模块里的主要成员

### 1、常量

SUBAGENT_STEP_MAX_CHARS是8192。每步text字段的默认字符上限。工具输出（搜索结果、文件内容）可能很大。这个上限约束持久化行和流式帧。只影响显示和存储。子代理自己的LLM上下文由ToolOutputBudgetMiddleware单独约束。

SUBAGENT_EVENT_CATEGORY是持久化事件的category。专用category（不是"message"）让这些事件不进list_messages（线程消息流）。list_events返回它们。前端做fetch-on-expand。

_TERMINAL_EVENT_STATUS映射task_*终态事件到持久化状态。task_completed映射completed。task_failed映射failed。task_cancelled映射cancelled。task_timed_out映射timed_out。

### 2、capture_step_message函数

这个函数把新消息追加到captured列表。

一个"步骤"是助手轮次（AIMessage）或工具结果（ToolMessage）。issue #3779加进了后者。这样工具输出也保留。其他消息类型（HumanMessage）忽略。

去重靠id。有id的按id去重。没id的按完整字典比较去重。stream_mode="values"每次重发整个状态。同样的尾部消息重发时保持O(1)。

追加成功返回True。

### 3、capture_new_step_messages函数

这个函数捕获自processed_count以来追加的每条步骤消息。

stream_mode="values"每次重发完整历史。一个LangGraph super-step可以一次追加多条消息。最重要的是模型一轮发多个工具调用时。每个调用一条ToolMessage。只捕messages[-1]的旧行为会丢掉除最后一条之外的全部工具输出。

历史增长时。遍历每条新消息。历史没增长时。只重查尾部消息。这样无id的原地替换（同样长度、新内容）仍然被捕获。去重让未变化的重发变成空操作。

历史收缩时。cursor重置到新尾部。收缩发生在DeerFlowSummarizationMiddleware用RemoveMessage重写通道时。没有这个重置。压缩点之后追加的每一步都会被丢掉。id和内容去重防止重发压缩前已捕获的步骤。

有一条不变量说明。重置后无增长分支只重查messages[-1]。压缩列表里游标之下插入真正的新AIMessage会被漏掉。今天不可达。摘要中间件把摘要放独立状态键。压缩后的消息通道只有已见过的保留尾部消息。未来中间件违反这个不变量的话。重置分支需要全量重扫。

### 4、truncate_step_text函数

这个函数按max_chars截断文本。返回文本加是否截断的元组。

### 5、_bounded_tool_call函数

这个函数返回{name, args}。大参数封顶。

text字段有上限。但工具调用args以前是原样复制。一个write_file或bash调用带大载荷（完整文件内容、heredoc）会产生无界的持久化行和流式帧。JSON序列化后超限时。结构化值替换为截断的序列化预览。标记args_truncated。小参数保持结构化。卡片可以检查。

### 6、build_subagent_step函数

这个函数从捕获的消息字典构建紧凑步骤载荷。

kind是"tool"（type为tool的ToolMessage）或"ai"。AI步骤带tool_calls（name加args。大参数封顶）。工具步骤带来源tool_name。text截断到max_chars。truncated标记相应设置。

### 7、subagent_run_event函数

这个函数把task_*自定义流块映射到RunEventStore.put的参数。

返回event_type、category、content、metadata。不认识的块返回None。worker只持久化认得的。

task_started要求description是字符串或None。task_running要求message_index是非负整数（bool拒绝）且message是字典。格式不对返回None。这样持久化记录总是满足要求的数据封套。

终态事件带status。model_name是字符串时加入。usage走normalize_token_usage验证后加入。result和error用SUBAGENT_STEP_MAX_CHARS截断。带truncated标记。完整原始结果保留在终态ToolMessage上。卡片单独读。

## 三、它和谁协作

executor的流循环调用capture_new_step_messages。捕获每条新的AIMessage和ToolMessage。

runtime/runs/worker的_SubagentEventBuffer用subagent_run_event把task_*事件持久化为subagent.start、subagent.step、subagent.end。

task_tool用build_subagent_step构建task_running事件里的步骤载荷。

status_contract的normalize_token_usage被复用。

它依赖langchain_core的消息类型。依赖runtime.events.catalog的事件定义。依赖utils.messages的文本提取。

## 四、重要性评级

评级是6分（满分10分）。

理由：

这个模块解决了一个真实的用户可见问题。子代理步骤以前不持久化。刷新后丢失。现在每步都持久化。前端可以做fetch-on-expand。

它保持纯函数。不需要起图就能单元测试。流式和持久化共享一个"步骤"定义。不漂移。

多个边界情况处理得很细。无id消息的内容去重。多工具调用一步的捕获。历史收缩后的cursor重置。大参数的封顶加标记。无界行被截断。

它影响前端卡片和事件存储。给6分。
