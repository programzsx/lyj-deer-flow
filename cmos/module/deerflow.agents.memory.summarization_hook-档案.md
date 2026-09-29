# deerflow.agents.memory.summarization_hook-档案

## 一、这个模块是干什么的

这个文件是记忆系统连接摘要生命周期的钩子。

摘要功能会在上下文接近令牌上限时压缩对话。

压缩会从状态里删除旧消息。

旧消息被删除后就再也找不回来了。

这个文件在删除发生之前拦截。

拦截的时机是摘要即将删除消息之前。

拦截后把即将被摘要的消息刷进记忆队列。

记忆队列会在后台提取值得长期保留的内容。

没有这个钩子。

被摘要的消息永远不会进入记忆。

用户早期说过的重要信息会在压缩时丢失。

这个文件只有一个函数。

函数是memory_flush_hook。

这个函数是薄的、后端中立的入口。

只做三件事。

三件事是开关检查、身份解析、调用管理器。

消息过滤、人工和AI校验、纠正和强化检测都由后端做。

## 二、模块里的主要成员

### 1、memory_flush_hook函数

memory_flush_hook是唯一的公共函数。

函数签名接收两个参数。

第一个参数是event。

event是SummarizationEvent。

SummarizationEvent来自summarization_middleware。

第二个参数是pii_redaction_config。

pii_redaction_config是可选的PII脱敏配置。

类型是PiiRedactionConfig或None。

函数没有返回值。

#### （1）第一个步骤，开关检查

函数先检查两个条件。

第一个条件是get_memory_config().enabled。

记忆功能关闭时直接返回。

第二个条件是event.thread_id。

thread_id不存在时直接返回。

没有线程id的消息无法定位归属的会话。

两个条件任一不满足就静默返回。

#### （2）第二个步骤，解析用户身份

函数调用resolve_runtime_user_id(event.runtime)。

runtime来自摘要事件。

这个解析保持Gateway和独立LangGraph运行在同一个用户范围内。

解析出的user_id会被传给记忆管理器。

用户身份决定消息落到哪个用户的记忆桶。

#### （3）第三个步骤，刷进记忆队列

函数调用get_memory_manager().add_nowait。

add_nowait表示立即优先处理。

不用防抖延迟。

原因是这些消息马上就要被从状态里删除。

普通防抖可能让消息在删除之后才被处理。

消息的原文会因此丢失。

add_nowait接收四个参数。

thread_id定位会话。

messages是待摘要消息列表。

agent_name定位agent桶。

user_id定位用户桶。

#### （4）边界上的脱敏

入队前消息经过redact_queued_messages处理。

redact_queued_messages来自memory_middleware。

这一步是PII脱敏。

脱敏必须发生在这个边界。

AGENTS.md解释了原因。

这是3190号问题的攻击向量5。

压缩会在入队后马上把这些消息从状态里删除。

后端的after-agent脱敏来不及修复已入队的原始批次。

原始批次一旦带着PII进入记忆。

PII就持久化在磁盘上了。

所以脱敏要在入队这个点完成。

### 2、设计意图

这个函数刻意的薄。

只保留enabled开关、thread_id检查、user_id解析。

后端通过manager.add_nowait做剩下的一切。

剩下的一切包括过滤、人工和AI消息校验、纠正和强化检测。

这种分层让这个钩子不依赖任何具体后端。

更换记忆后端不需要改这个文件。

这是emergency flush路径。

和普通的后台防抖路径不同。

emergency flush保证摘要删除前的消息一定被记忆系统看到。

## 三、它和谁协作

### 1、它依赖谁

它依赖deerflow.agents.memory的get_memory_manager获取单例管理器。

它依赖deerflow.agents.middlewares.memory_middleware的redact_queued_messages做脱敏。

它依赖deerflow.agents.middlewares.summarization_middleware的SummarizationEvent类型。

它依赖deerflow.config.memory_config的get_memory_config查开关。

它依赖deerflow.config.pii_redaction_config的PiiRedactionConfig类型。

它依赖deerflow.runtime.user_context的resolve_runtime_user_id解析用户。

### 2、谁调用它

摘要中间件调用它。

摘要中间件在backend/packages/harness/deerflow/agents/middlewares/summarization_middleware.py。

摘要中间件在触发摘要时构造SummarizationEvent。

事件携带thread_id、runtime、agent_name、messages_to_summarize。

摘要中间件把事件交给这个钩子。

手动压缩也走同一条路径。

POST /api/threads/id/compact复用同一个DeerFlowSummarizationMiddleware。

自动摘要和手动压缩都会触发记忆刷写。

### 3、整个数据流

对话接近令牌上限。

摘要中间件决定压缩。

压缩前摘要中间件调用memory_flush_hook。

钩子检查开关和线程id。

钩子解析用户身份。

钩子脱敏待摘要消息。

钩子调用add_nowait把消息入队。

DeerMem后端收到队列条目。

DeerMem用LLM提取事实和摘要。

提取结果持久化到磁盘。

之后摘要从状态里删除旧消息。

旧消息的信息已经进了记忆。

信息没有丢失。

## 四、重要性评级

评级是8分。

理由是这个文件是记忆系统防丢失的关键环节。

摘要删除是不可逆的。

没有这个钩子，被压缩的消息永远进不了记忆。

用户长期积累的偏好和上下文会在每次压缩时丢失。

脱敏在这个边界完成也是安全关键逻辑。

PII一旦带着原文进入记忆就无法事后修复。

add_nowait的紧急优先级设计保证了时序正确。

不评更高分的原因是它只有三十多行。

它本身不做提取、不做过滤、不做持久化。

核心工作全部在DeerMem后端和摘要中间件里。

它是薄的一层连接代码，不是复杂的核心逻辑。
