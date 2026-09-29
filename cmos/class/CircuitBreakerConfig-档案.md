# CircuitBreakerConfig档案

一、这个类是干什么的

CircuitBreakerConfig是LLM熔断器的配置类。熔断器处理持续失败的提供者。这个类控制熔断器何时跳闸。这个类还控制恢复等待时间。这个类继承自pydantic的BaseModel。

二、类的成员

（一）字段

- failure_threshold：整数。默认值是5。这个字段是连续失败几次后熔断器跳闸。
- recovery_timeout_sec：整数。默认值是60。这个字段是熔断器跳闸后尝试恢复前的等待秒数。

（二）方法

这个类没有自定义方法。这个类只有两个字段。

三、它和谁协作

AppConfig持有这个类。AppConfig的circuit_breaker字段是这个类的实例。LlmCallConfig处理并发和重试。两者职责不同。熔断器实现读取这个实例。

四、重要性评级

评级：5分。

理由：熔断器保护系统不被持续失败的提供者拖垮。字段简单但作用关键。默认值合理。所以重要性中等。
