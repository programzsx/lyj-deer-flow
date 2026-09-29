# TracingConfig档案

一、这个类是干什么的

TracingConfig是受支持提供者的追踪配置聚合类。这个类聚合三个追踪提供者。LangSmith、Langfuse和Monocle。这个类继承自pydantic的BaseModel。

二、类的成员

（一）字段

- langsmith：LangSmithTracingConfig实例。必填字段位。LangSmith的配置。
- langfuse：LangfuseTracingConfig实例。必填字段位。Langfuse的配置。
- monocle：MonocleTracingConfig实例。必填字段位。Monocle的配置。

（二）方法

- is_configured：属性。这个属性返回有没有配置完整且启用的提供者。
- explicitly_enabled_providers：属性。这个属性返回显式启用的提供者名。不管配置完不完整。
- enabled_providers：属性。这个属性返回已配置且启用的提供者名。
- validate_enabled：这个方法调用各提供者的validate。校验启用的提供者配置完整。

模块级还有get_tracing_config、get_enabled_tracing_providers、get_explicitly_enabled_tracing_providers、validate_enabled_tracing_providers、is_tracing_enabled、is_monocle_tracing_enabled、reset_tracing_config。get_tracing_config从环境变量构造配置。用锁保证双检缓存。

三、它和谁协作

LangSmithTracingConfig、LangfuseTracingConfig和MonocleTracingConfig是这个类的字段类型。追踪回调和遥测初始化代码读取这个类。

四、重要性评级

评级：5分。

理由：这个类是追踪配置的聚合入口。显式启用和完整配置是两个不同的判断。区分让启动校验更准确。所以重要性中等。
