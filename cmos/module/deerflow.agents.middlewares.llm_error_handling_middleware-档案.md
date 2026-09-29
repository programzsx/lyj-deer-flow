# deerflow.agents.middlewares.llm_error_handling_middleware档案

源码路径是backend/packages/harness/deerflow/agents/middlewares/llm_error_handling_middleware.py。

## 一、这个中间件是干什么的

这个中间件负责LLM调用的错误处理。

模型调用会失败。

失败的原因有很多。

网络超时、限流、配额不足、认证失败、服务繁忙、空响应。

没有这个中间件，任何一次模型调用失败都会让整个运行中断。

这个中间件把失败变成可恢复的助手错误。

它做三件事。

第一件事是重试。

可重试的瞬时错误按指数退避自动重试。

第二件事是熔断。

连续失败触发熔断器，保护系统。

第三件事是兜底。

不可恢复的失败转成用户可见的友好错误消息。

运行不会崩溃。

## 二、模块里的主要成员

### 1、重试相关的常量

_RETRIABLE_STATUS_CODES是可重试的HTTP状态码集合。

包括408、409、425、429、500、502、503、504。

_BUSY_PATTERNS是繁忙错误的文本模式。

包括中英文的"服务繁忙"、"overloaded"等。

_QUOTA_PATTERNS是配额错误的文本模式。

_AUTH_PATTERNS是认证错误的文本模式。

_BURST_PATTERNS是突发限流的文本模式。

突发限流是请求速率增长过快触发的。

这不是配额限制。

### 2、重试预算覆盖

_RETRY_BUDGET_OVERRIDES是按异常类名的重试预算覆盖。

EmptyModelResponseError、StreamChunkTimeoutError、ReadTimeout都限制为2次尝试。

StreamChunkTimeoutError在提供商停滞后才触发。

完整3次重试会堆叠6到12分钟的空白。

所以只保留1次重试然后快速失败。

_REASON_RETRY_BUDGETS是按原因的重试预算覆盖。

burst_rate限制为2次尝试。

重试进突发限流会给正在被节流的请求坡度加需求。

所以只重试1次并配合更长退避。

覆盖只能收紧预算。

用户配置的retry_max_attempts仍然是上限。

最紧的边界生效。

### 3、EmptyModelResponseError类

这是模块定义的异常类。

表示模型正常完成但没有产出持久内容。

带response_message属性。

### 4、_raise_for_empty_response函数

这个函数在响应写入图状态前检查空响应。

最后一条AI消息有可见内容或有工具调用意图时通过。

finish_reason是stop、end_turn或空时抛出EmptyModelResponseError。

### 5、_consume_empty_response_retry函数

这个函数消费空响应重试预算。

每个run只有一次空响应重试机会。

预算存在运行时上下文里。

已消费时返回False。

没有运行时上下文的直接调用保留每次调用一次重试。

### 6、_ProcessWideLimiter类

这是进程级LLM调用并发限制器。

asyncio.Semaphore绑定第一个事件循环。

跨循环获取会报错。

所以它不能同时限制主智能体和子智能体。

子智能体运行在另一个循环上。

这个限制器用threading原语构建。

不绑定循环。

每条调用路径共享一个在途计数和一个上限。

上限在构造时设置。

之后不可变。

不变式有三个。

一个是无损的等待者交接。

被取消的等待者把预留的许可交给下一个等待者。

一个是启动时定死上限。

上限只在第一次构造时解析。

之后不再变动。

一个是不变的在途计数。

许可通过finally释放，不会泄漏。

### 7、_AsyncWaiter类

这是等待许可的异步调用者。

granted标志表示许可已预留。

预留和出队是原子的。

取消时根据granted判断是否欠一次交接。

### 8、进程级上限相关函数

_get_process_limiter函数返回进程限制器。

None表示上限禁用。

这是唯一的上限开关。

_apply_configured_cap函数在第一次构造时解析上限。

第一次调用生效并冻结。

后续调用被忽略。

改上限需要重启网关。

### 9、LLMErrorHandlingMiddleware类

这是中间件类。

这个类继承AgentMiddleware。

### （1）构造函数

构造参数是AppConfig。

从circuit_breaker配置读熔断阈值和恢复超时。

从llm_call配置读重试次数、基础延迟、延迟上限、突发退避、并发上限。

### （2）_check_circuit方法

这个方法检查熔断器状态。

返回True表示熔断打开，快速失败。

状态有三档。

closed是正常。

open是熔断，恢复超时后转half_open。

half_open是试探，只放一个探测请求。

其他请求快速失败。

### （3）熔断记录方法

_record_success方法重置熔断器。

_record_failure方法累计失败。

达到阈值时打开熔断。

half_open状态的探测失败直接重新打开。

_release_half_open_probe方法释放探测位。

用于GraphBubbleUp信号或不可重试错误。

### （4）熔断代际所有权

_CircuitAdmission是代际凭证。

每个调用带自己的代际。

_owns_current_circuit_generation方法检查所有权。

只有当前代际的持有者能结算或释放half_open探测。

过期的完成不会影响更新的恢复尝试。

### （5）_classify_error方法

这个方法把异常分类。

返回是否可重试和原因。

分类顺序是固定的。

AdmissionError不可重试。

配额和认证错误不可重试。

EmptyModelResponseError可重试。

突发限流可重试，在通用429映射之前检测。

超时和连接类异常可重试。

IndexError也可重试。

原因是某些提供商返回200空generations列表。

状态码在可重试集合里的可重试。

繁忙模式可重试。

其余不可重试。

### （6）_bounded_model_call_sync和_bounded_model_call方法

这两个方法在进程级并发上限下运行单次模型尝试。

限制器只包单次尝试，不包重试循环。

退避睡眠会释放槽位。

上限禁用时直接透传。

### （7）_build_retry_delay_ms方法

这个方法计算下次重试延迟。

提供商的Retry-After头优先遵守。

否则用AWS风格的去相关抖动。

先钳位到上限再抽随机数。

让抖动均匀分布。

突发限流用更长的基础延迟。

确定性指数退避会让并发的重试对齐到同一个节拍。

整批失败的重试风暴会再次触发限流。

去相关抖动把重试摊开。

### （8）用户消息构建方法

_build_user_message方法按原因生成用户文案。

配额错误提示修复账户。

认证错误提示检查凭证。

流中断错误提示拆分工作。

_build_circuit_breaker_message方法生成熔断文案。

_build_error_fallback_message方法生成兜底AIMessage。

消息带deerflow_error_fallback标记和错误元数据。

### （9）重试事件

_build_retry_event方法构建llm_retry自定义事件。

事件带尝试次数、有效预算、等待时间、原因。

_emit_retry_event和_aemit_retry_event发出事件。

事件里用有效预算而非配置上限。

这样UI承诺的重试次数真实存在。

### （10）wrap_model_call和awrap_model_call钩子

这两个钩子实现完整流程。

先检查熔断器。

打开时直接返回熔断兜底消息。

然后进入重试循环。

每次尝试在并发上限下执行。

成功时记录熔断成功并返回。

GraphBubbleUp信号释放探测位并向上传播。

可重试错误且预算未用完时发事件、睡眠、重试。

不可重试或预算用完时记录熔断失败并返回用户兜底消息。

空响应重试消耗每run一次的预算。

非熔断失败原因不计入熔断。

异步版本在CancelledError时释放探测位并重新抛出。

取消不是提供商失败。

### （11）release_policy_parameters方法

这个方法返回空响应重试限制和作用域。

### 10、错误提取函数

_extract_error_code函数从异常里提取错误码。

_extract_status_code函数提取HTTP状态码。

_extract_retry_after_ms函数提取Retry-After头。

支持毫秒、秒、日期三种格式。

_extract_error_detail函数提取错误详情。

## 三、它和谁协作

这个中间件是运行时中间件链的成员。

装配在tool_error_handling_middleware.py的_build_runtime_middlewares里。

它的位置在InputSanitization之后。

所以内层重试时看到的是净化后的消息。

每个内层中间件都能从重试中受益。

依赖model_response模块的响应检查函数。

依赖models.request_admission的AdmissionError。

依赖utils.custom_events发出重试事件。

依赖config.app_config的熔断和LLM调用配置。

配置在config.yaml的llm_call和circuit_breaker节。

主智能体和子智能体共享进程级并发限制器。

## 重要性评级

评级是9分。

理由如下。

模型调用是整个系统的核心路径。

任何一次模型调用失败都会中断运行。

没有这个中间件，网络抖动、限流、空响应都会直接炸掉用户的会话。

这个中间件让失败变成可恢复的。

重试带去相关抖动，防止重试风暴。

熔断器保护系统不被持续失败拖垮。

熔断代际防止过期的完成污染新的恢复尝试。

进程级并发限制器跨循环工作。

这个设计不是asyncio.Semaphore能替代的。

错误分类细致，用户文案可操作。

所以评级是9分。

不评10分的原因是熔断器状态是实例级的。

多实例部署下每个中间件实例有独立熔断状态。

另外提供商彻底不可用时兜底消息也无法调用模型确认。

所以评级是9分。
