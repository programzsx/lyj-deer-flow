# LlmCallConfig档案

一、这个类是干什么的

LlmCallConfig是LLM调用执行的配置类。这个类控制并发和限速整形。这个类和CircuitBreakerConfig不同。熔断器处理失败的提供者。这个类和ModelConfig也不同。ModelConfig描述模型端点。这个类控制多少LLM调用同时跑。这个类还控制重试退避的行为。这个类继承自pydantic的BaseModel。

二、类的成员

（一）字段

- max_concurrent_calls：整数。默认值是0。最小值是0。这个字段是进程内并发LLM调用的上限。0表示不设上限。设正数可以平滑提供者突发速率尖峰。每个进程一份。多worker时总上限是每进程值乘worker数。只在启动时捕获。改配置要重启网关。其余字段保持热加载。
- retry_max_attempts：整数。默认值是3。最小值是1。这个字段是可重试瞬时错误的最大尝试次数。1表示不重试。
- retry_base_delay_ms：整数。默认值是1000。最小值是0。这个字段是去相关抖动重试退避的基础毫秒数。
- retry_cap_delay_ms：整数。默认值是8000。最小值是0。这个字段是单次重试退避延迟的硬上限毫秒数。
- burst_retry_base_delay_ms：整数。默认值是5000。最小值是0。这个字段是提供者返回突发速率429时的退避基础毫秒数。比普通重试的基础大。让单次突发重试落在限流窗口之后。提供者发Retry-After时忽略这个值。

（二）方法

这个类没有自定义方法。所有约束都写在Field里。

三、它和谁协作

AppConfig持有这个类。AppConfig的llm_call字段是这个类的实例。LLM调用执行层读取这个实例。CircuitBreakerConfig和它配合。熔断器管失败。这个类管并发和重试。

四、重要性评级

评级：6分。

理由：这个类控制LLM调用的并发和重试。并发失控会触发提供者限流。重试参数影响失败恢复速度。所以重要性中等偏上。
