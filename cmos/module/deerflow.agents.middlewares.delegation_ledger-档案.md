# deerflow.agents.middlewares.delegation_ledger档案

源码路径是backend/packages/harness/deerflow/agents/middlewares/delegation_ledger.py。

## 一、这个模块是干什么的

这个模块负责任务委派台账的确定性提取和渲染。

主智能体可以把工作委派给子智能体。

委派通过task工具调用发生。

每次委派都会留下记录。

记录包括描述、状态、结果摘要。

这些记录合起来叫委派台账。

上下文压缩会丢掉旧消息。

台账让模型在压缩后仍然知道哪些工作已经委派过。

这个模块做两件事。

第一件事是提取。

extract_delegations从消息列表里枚举所有task委派和对应结果。

第二件事是渲染。

render_delegation_ledger把台账渲染成模型可见的文本。

渲染是确定性的。

渲染不是LLM摘要。

## 二、模块里的主要成员

### 1、常量

_RESULT_BRIEF_CAP是结果摘要的上限，值是2000字符。

_DESCRIPTION_CAP是描述的上限，值是200字符。

_LEDGER_RENDER_CHAR_BUDGET是台账渲染的总字符预算，值是6000。

_LEDGER_ENTRY_RESULT_RENDER_CAP是单条结果渲染的上限，值是120字符。

_STATUS_ONLY_RESULT_BRIEFS是按状态生成的固定摘要文案。

失败、取消、超时各有固定文案。

### 2、_bound_text函数

这个函数做确定性的头尾截断。

超长文本保留开头三分之二和结尾三分之一。

中间用省略标记代替。

这是机械截断，不是摘要。

### 3、_escape_context_text函数

这个函数对文本做HTML转义。

转义前先把连续空白合并成单个空格。

台账字段是来自子智能体的不可信数据。

转义防止字段值伪造框架标记。

### 4、_status_guidance函数

这个函数根据状态生成行动建议。

in_progress状态的建议是不要重复委派。

completed状态的建议是检查自报告再复用，避免重复工作。

带stop_reason的状态说明运行被护栏截断。

建议是复用部分结果或缩小范围重试。

failed、cancelled、timed_out状态都建议换计划重试。

### 5、extract_delegations函数

这是提取入口。

函数遍历消息列表。

第一轮遍历找AIMessage。

AIMessage的tool_calls里名字等于task的调用生成台账条目。

条目初始状态是in_progress。

描述取args的description或prompt字段，截断到200字符。

第二轮遍历找ToolMessage。

ToolMessage按tool_call_id配对到条目。

配对成功后读取additional_kwargs里的子智能体结果元数据。

元数据通过read_subagent_result_metadata读取。

读取内容包括状态、stop_reason、引用判定、验收判定。

结果文本取result_brief或error或状态固定文案。

结果文本截断到2000字符并算出sha256。

函数按出现顺序返回条目列表。

### 6、_render_entry_line函数

这个函数把单条台账渲染成一行。

行格式是状态、描述、子智能体类型、行动建议、结果摘要。

有引用判定时追加引用段落。

引用判定通过render_citation_verdict渲染。

有验收判定时追加验收段落和未解决项。

验收判定通过render_acceptance_segment渲染。

未解决项通过_render_acceptance_gaps渲染。

每个字段都先转义再拼进行。

### 7、_render_acceptance_gaps函数

这个函数渲染验收判定的未解决项。

未解决项分两类。

一类是checked为true但holds为false，标记是does not hold。

一类是checked为false，标记是UNVERIFIED。

每类保留一个可操作的例子。

剩余的未解决项用计数行代替。

标准详情各自独立截断和转义。

完整判定保存在台账状态里。

### 8、render_delegation_ledger函数

这是渲染入口。

空台账返回空字符串。

渲染从固定标题开始。

标题说明新条目在前，进行中的工作已委派，完成不等于验收。

然后从最新到最旧逐条渲染。

超出预算时停止追加。

超出时追加省略行。

省略行说明省略了多少条旧台账。

省略行本身也超预算时逐行弹出已渲染的行。

最后整体兜底硬截断。

## 三、它和谁协作

上游是DurableContextMiddleware。

DurableContextMiddleware在before_model和after_model钩子里调用extract_delegations。

提取结果存进ThreadState的delegations状态。

注入时DurableContextMiddleware调用render_delegation_ledger渲染台账。

渲染结果进durable_context_data数据块。

这个模块依赖receipt_verification的引用判定校验和渲染。

依赖subagents.acceptance_checks的验收判定。

依赖subagents.status_contract的read_subagent_result_metadata。

依赖thread_state的DelegationEntry类型定义。

## 重要性评级

评级是7分。

理由如下。

长会话必然触发上下文压缩。

压缩后模型会忘记已经委派过的工作。

没有台账，模型会重复委派同一任务。

重复委派浪费token，也可能产生冲突的子智能体输出。

台账保证委派历史在压缩后仍然可见。

台账还带验收判定，帮模型判断结果能不能复用。

所以这个模块很重要。

不评更高分的原因是这个模块是纯函数库，没有中间件类。

提取和渲染都被DurableContextMiddleware消费，本身不做状态管理。

另外可见性依赖DurableContextMiddleware的装配。

所以评级是7分。
