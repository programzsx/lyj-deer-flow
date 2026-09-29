# MemoryConfig档案

一、这个类是干什么的

MemoryConfig是记忆机制的宿主共享配置类。DeerMem私有字段在backends/deermem/config.py里。私有配置通过backend_config字典传递。这个类只包含宿主共享字段。保持共享schema精简让后端可替换。这个类继承自pydantic的BaseModel。

二、类的成员

（一）字段

- enabled：布尔值。默认值是True。这个字段是记忆机制的调用点开关。
- mode：字面量。取值是middleware或tool。默认值是middleware。middleware是每轮之后被动摘要。tool是模型直接调用记忆工具。两种模式互斥。
- injection_enabled：布尔值。默认值是True。这个字段表示要不要把记忆注入系统提示。
- shutdown_flush_timeout_seconds：浮点数。默认值是30.0。取值范围是1到300。这个字段是优雅关闭时排空待更新缓冲的硬时间预算。必须装进K8s的终止宽限期。超时后未完成的尾部被丢弃。
- manager_class：字符串。默认值是deermem。这个字段是记忆后端选择器。可以是注册的后端名。也可以是MemoryManager子类的点分路径。工厂解析失败报错。记忆是持久状态。所以不能静默替换。
- backend_config：字典。默认值是空字典。这个字段是后端私有配置。工厂原样传给后端构造函数。
- prescreen：MemoryPrescreenConfig实例。这个字段是抽取调用之上的成本门。
- signal_classification：MemorySignalClassificationConfig实例。这个字段是信号分类提示槽。

（二）方法

- _check_judging_slots_are_usable：模型校验器。这个方法确保配置过的槽必须指名提供者。mode不是off但use为空就报错。

模块级还有should_use_memory_tools、get_memory_config、set_memory_config、load_memory_config_from_dict四个函数。get_memory_config会触发签名校验的热加载。load函数会把遗留的顶层DeerMem字段自动迁移进backend_config。

三、它和谁协作

AppConfig持有这个类。AppConfig的memory字段是这个类的实例。配置加载时load_memory_config_from_dict写入模块级单例。MemoryPrescreenConfig和MemorySignalClassificationConfig是这个类的字段类型。记忆管理器工厂读取manager_class。

四、重要性评级

评级：7分。

理由：记忆是代理的核心能力之一。mode决定记忆的工作方式。遗留字段迁移保证升级不丢配置。所以重要性中上。
