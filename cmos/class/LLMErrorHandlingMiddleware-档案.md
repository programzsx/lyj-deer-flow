# LLMErrorHandlingMiddleware档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/llm_error_handling_middleware.py`

## 一、这个类是干什么的

LLMErrorHandlingMiddleware是模型调用的稳定层。

它做四件事。

第一件是重试。瞬态错误按退避策略重试。退避用带去相关抖动的算法。提供方给了Retry-After就原样遵守。突发限流429有专门的更长基础延迟。用户配置的重试次数是上限。按异常类型和按原因的预算覆盖只能收紧，不能放宽。

第二件是熔断。连续失败到阈值就打开熔断器。打开之后快速失败，不再打真实请求。半开状态放行一个探针。探针成功就关闭熔断器。

第三件是并发控制。全进程共享一个在飞上限。退避睡觉期间会释放名额。所以限制的是在飞请求，不是等待请求。

第四件是兜底。重试用尽之后，给用户返回一条体面的助手消息。而不是把异常裸抛给前端。

## 二、类的成员

### （一）字段

- `retry_max_attempts`：最大重试次数，默认3。
- `retry_base_delay_ms`：普通重试的基础延迟，默认1000毫秒。
- `retry_cap_delay_ms`：延迟上限，默认8000毫秒。
- `burst_retry_base_delay_ms`：突发限流的重试基础延迟，默认5000毫秒。
- `max_concurrent_llm_calls`：进程级并发上限，0表示不启用。

### （二）方法

钩子方法是重点。

- `wrap_model_call`：同步钩子。包住整个模型调用。进入熔断检查。带并发上限跑重试循环。失败后构建兜底消息。
- `awrap_model_call`：异步版本的同一个钩子。

配置与策略方法：

- `__init__`：从AppConfig读配置。第一次构造时设定进程级限制器的上限。
- `release_policy_parameters`：声明影响行为的配置。
- `_max_attempts_for`：算某个异常的有效重试上限。取全局、按异常覆盖、按原因覆盖里最紧的那个。
- `_classify_error`：把异常分类。返回是否可重试和原因标签。
- `_build_retry_delay_ms`：算下一次重试延迟。用去相关抖动。先夹到上限再抽取，保证分布均匀。
- `_build_retry_message`、`_build_retry_event`、`_emit_retry_event`、`_aemit_retry_event`：构建并发出重试事件。
- `_build_circuit_breaker_message`、`_build_error_fallback_message`、`_build_user_message`、`_build_user_fallback_message`：构建用户可见的兜底消息。

熔断方法：

- `_check_circuit`：返回熔断器是否处于打开状态。
- `_owns_current_circuit_generation`：检查调用是否还持有当前熔断代。
- `_record_success`、`_record_failure`：记录成败，驱动熔断器状态机。
- `_release_half_open_probe`：释放半开探针但不记失败。防止控制流信号卡死熔断器。

并发包装方法：

- `_bounded_model_call_sync`和`_bounded_model_call`：在进程级上限下跑单次尝试。上限包住的是单次尝试，不是重试循环。许可在finally里释放，任何退出路径都不泄漏。

## 三、它和谁协作

- 它是中间件链里最外层的模型调用包装层之一。重试意味着内层钩子会被重新执行。
- 它依赖AppConfig读配置。
- 它依赖_ProcessWideLimiter做全进程并发控制。
- 它依赖_CircuitAdmission做熔断代管理。
- 它依赖_AsyncWaiter做异步等待。
- 它向下游发重试事件。下游包括RunEventStore和SSE消费者。
- LoopDetectionMiddleware和TokenBudgetMiddleware的警告恢复逻辑明确依赖它的重试行为。

## 四、重要性评级

评级：10/10。

理由：所有模型调用都要穿过这个中间件。重试策略决定了服务在面对限流和网络抖动时的可用性。熔断器决定了故障时不会雪崩。并发上限决定了成本失控不会发生。兜底消息决定了用户在故障时看到什么。它是整个中间件链里影响面最广的类之一。