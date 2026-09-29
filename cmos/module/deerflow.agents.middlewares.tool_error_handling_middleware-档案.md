# deerflow.agents.middlewares.tool_error_handling_middleware-档案

源码路径是backend/packages/harness/deerflow/agents/middlewares/tool_error_handling_middleware.py。

## 一、这个中间件是干什么的

这个文件承担两个职责。

职责一是ToolErrorHandlingMiddleware中间件本身。

职责二是整个中间件链的装配函数。

先说职责一。

工具执行时会抛异常。

异常如果不处理，整个运行会中断。

这个中间件把工具异常转换成错误ToolMessage。

运行可以继续，不会中断。

模型能看到错误信息。

模型可以自己决定下一步怎么办。

再说职责二。

_build_runtime_middlewares是整个中间件链的装配函数。

这个函数暴露为build_lead_runtime_middlewares。

主智能体和子智能体共用大部分基础中间件。

这个函数决定谁在前谁在后。

顺序决定了包装层的内外关系。

所以这个文件是中间件体系的地基。

## 二、模块里的主要成员

### 1、类ToolErrorHandlingMiddleware

这个类是中间件主体。

构造函数接收app_config。

app_config决定技能读取工具名单和技能根路径。

没有app_config就用默认值。

#### （1）wrap_tool_call钩子

wrap_tool_call包裹同步工具执行。

它先调用handler执行工具。

handler抛出GraphBubbleUp时直接重新抛出。

GraphBubbleUp是LangGraph的控制流信号。

控制流信号包括interrupt、pause、resume。

这些信号必须原样传播。

handler抛出其他异常时记录日志。

然后调用_build_error_message生成错误ToolMessage。

工具正常返回时调用normalize_tool_result归一化结果。

归一化时传入tool_call_id。

只有匹配的ToolMessage会被打元数据。

然后调用_maybe_stamp追加生产者绑定的元数据。

#### （2）awrap_tool_call钩子

awrap_tool_call是异步版本。

逻辑和同步版本完全一样。

异常处理、归一化、打标都一样。

#### （3）_build_error_message方法

这个方法构建错误ToolMessage。

错误消息的格式是固定的。

格式是"Error: Tool '<工具名>' failed with <异常类名>: <详情>。<恢复提示>"。

详情超过500字符会被截断。

截断用"...""后缀。

tool_call_id缺失时用"missing_tool_call_id"占位。

消息会经过两步打标。

第一步是_stamp_task_exception_status。

第二步是stamp_exception_meta。

#### （4）_stamp_task_exception_status函数

这个模块级函数给task工具的异常包装打失败元数据。

只有task工具会被处理。

它调用format_subagent_result_message生成内容。

内容会追加恢复提示。

additional_kwargs会追加结构化的失败元数据。

这样task工具在task_tool构建自己的Command之前抛出的异常。

这些异常也携带同样的结构化元数据。

#### （5）_stamp_skill_read_metadata方法

这个方法给技能读取打元数据。

只有配置名单里的工具会被处理。

错误结果不处理。

内容必须是字符串。

工具调用里必须有path参数。

满足条件时构建技能条目元数据。

元数据包括SKILL_CONTEXT_ENTRY_KEY。

还包括SKILL_USAGE_KEY。

部分读取会标记partial。

#### （6）_maybe_stamp方法

这个方法应用生产者绑定的元数据。

它会先弹出消息里已有的技能元数据。

工具返回的kwargs是不可信的。

只有这个中间件可以在检查配置的生产者和路径之后添加技能证据。

然后按tool_call_id匹配打标。

结果可能是ToolMessage。

结果也可能是Command。

Command里的每条ToolMessage都会被处理。

### 2、装配函数_build_runtime_middlewares

这个函数构建共享的基础中间件。

它把中间件分成四层。

#### （1）第一层外层包装

第一层是最外层的wrap_model_call包装。

顺序从外到内如下。

第一个是InputSanitizationMiddleware。

它排第一所以成为最外层包装。

内层所有中间件看到的都是消毒后的消息。

第二个是KnowledgeScopeMiddleware。

它暴露Gateway准入的执行范围。

第三个是ToolOutputBudgetMiddleware。

它用from_app_config构造。

第四个是ToolResultSanitizationMiddleware。

它中和远程工具结果里的注入标签。

它排在预算中间件之后。

所以它先中和原始输出。

预算包装再截断已中和的文本。

app_config.pii_redaction.enabled开启时追加PiiRedactionMiddleware。

PII中间件排最后所以是最内层包装。

工具结果先做PII脱敏。

然后才做标签中和和外置。

#### （2）第二层线程钩子

第二层是读取线程数据的before_agent钩子。

ThreadDataMiddleware永远在。

include_uploads为真时追加UploadsMiddleware。

然后追加SandboxMiddleware。

SandboxMiddleware接收lazy_init、available_skills、owns_agent_skill_projection。

#### （3）第三层尾部中间件

第三层是后处理型的中间件。

include_dangling_tool_call_patch为真时追加DanglingToolCallMiddleware。

然后追加LLMErrorHandlingMiddleware。

verification.receipts_enabled开启时追加ToolReceiptMiddleware。

ToolReceiptMiddleware是最外层的wrap_tool_call层。

原因如下。

Guardrail、SandboxAudit、ReadBeforeWrite、ToolProgress都能用自己的ToolMessage短路一个调用。

SandboxAudit还会重建中风险结果。

内层的回执层会在这些结果上漏掉记录。

回执层在最外就不会漏。

artifact解析条件开启时追加ArtifactResolutionMiddleware。

authorization.enabled开启时追加授权GuardrailMiddleware。

授权提供者不存在时用resolve_authorization_provider解析。

授权提供者被GuardrailAuthorizationAdapter包装。

授权排在外部guardrail之前。

已拒绝的工具不用再调外部策略。

guardrails.enabled且配置了provider时追加显式GuardrailMiddleware。

提供者类用resolve_variable加载。

构造函数接受framework参数时注入"deerflow"提示。

然后无条件追加SandboxAuditMiddleware。

read_before_write.enabled开启时追加ReadBeforeWriteMiddleware。

这个中间件是最外层的写门。

它必须排在ToolProgress和ToolErrorHandling外面。

被阻塞的写不消耗ToolProgress槽位。

tool_progress.enabled开启时追加ToolProgressMiddleware。

ToolProgress必须排在ToolErrorHandling外面。

这样ToolProgress读到的结果已经带上deerflow_tool_meta。

然后追加ToolErrorHandlingMiddleware本身。

tool_artifacts.enabled开启时追加ArtifactCaptureMiddleware。

ArtifactCapture是before_model钩子。

它在工具执行包装链里的位置无关紧要。

它排在最后纯粹为了可读性。

#### （4）最终组装

三个层按顺序合并成完整列表。

顺序不变量声明在deerflow.extensions.ordering。

不变量在组装末尾验证一次。

### 3、build_lead_runtime_middlewares

这个函数是主智能体的共享中间件入口。

它调用_build_runtime_middlewares。

它开启uploads。

它开启dangling_tool_call_patch。

回执渲染模式用配置里的receipts_render_mode。

主链默认是delegation_only。

授权基础设施工具名来自deferred_setup的tool_search。

### 4、build_subagent_runtime_middlewares

这个函数是子智能体的共享中间件入口。

app_config缺失时用get_app_config解析。

它调用_build_runtime_middlewares。

差异点如下。

它不开启uploads。

回执渲染模式固定是"always"。

子智能体链总是渲染回执账本。

没有账本就没有引用。

没有引用第一层就失效。

它不拥有技能投影。

owns_agent_skill_projection是False。

#### （1）子智能体专属追加

子智能体基础段之后追加以下中间件。

SkillActivationMiddleware加上SkillToolPolicyMiddleware成对出现。

两者共享slash_source_owner_token。

token用secrets.token_urlsafe生成。

deferred_setup有延迟工具时追加DeferredToolPromotionAuditMiddleware。

模型支持视觉时追加ViewImageMiddleware。

传入了mcp_routing_middleware就追加。

deferred_setup有延迟工具时追加DeferredToolFilterMiddleware。

还要断言McpRouting在DeferredFilter之前。

loop_detection.enabled开启时追加LoopDetectionMiddleware。

子智能体今天不继承主链的失控守卫。

没有循环检测时退化的子智能体循环会一直跑到max_turns。

每次重发越来越大的上下文。

这就是报告过的440万token烧毁。

token_budget开启时追加TokenBudgetMiddleware。

默认上限和summarization.enabled耦合。

压缩开启是100万。

压缩关闭是200万。

用户设置的预算永远优先。

然后追加配置声明的扩展中间件。

safety_finish_reason.enabled开启时追加SafetyFinishReasonMiddleware。

注册顺序在LoopDetection之后。

LangChain按逆序派发after_model钩子。

所以SafetyFinishReason先执行。

它剥离安全终止的tool_calls。

LoopDetection再在干净消息上记账。

然后追加DurableContextMiddleware。

它把summary_text投影进后续模型请求。

否则严格提供商会拒绝assistant开头的请求。

然后追加SummarizationMiddleware。

条件是summarization.enabled。

skip_memory_flush是True。

不跳过时子智能体的内部轮次会写进父线程的持久记忆。

传run_model_name让独立模型的子智能体用自己的模型做摘要。

然后追加SubagentDateContextMiddleware。

这个日期中间件没有AppConfig和记忆依赖。

最后追加SystemMessageCoalescingMiddleware。

它把所有SystemMessage合并成一个开头块。

严格后端拒绝非开头的system消息。

最后用compose_with_extensions和扩展组合。

## 三、它和谁协作

这个中间件位于每个工具调用包装链的最内层。

外面依次是ToolProgress、ReadBeforeWrite、SandboxAudit、Guardrail、ToolReceipt。

它依赖以下模块。

依赖tool_result_meta做结果归一化和异常打标。

依赖skill_context和skill_usage做技能元数据。

依赖subagents.status_contract做task结果格式化。

装配函数被lead_agent/agent.py的build_middlewares调用。

build_middlewares在基础段之后追加lead-only条目。

它被子智能体构建路径调用。

可选中间件的装配条件来自AppConfig。

配置项包括pii_redaction、verification、authorization、guardrails、read_before_write、tool_progress、tool_artifacts、loop_detection、token_budget、safety_finish_reason。

## 重要性评级

评级是10分。

理由如下。

这个文件是整个中间件体系的核心。

它承担两个不可替代的职责。

职责一是工具异常兜底。

没有它，一个工具异常就中断整个运行。

职责二是中间件链装配。

全链的顺序约束都定义在这里。

顺序错误会破坏消毒、预算、回执、写门、进度守卫的内外关系。

每个顺序决策都有明确的注释和issue编号。

删除这个文件等于删除整个智能体运行能力。

所以评级是10分。
