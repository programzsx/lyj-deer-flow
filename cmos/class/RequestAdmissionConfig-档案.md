# RequestAdmissionConfig档案

一、这个类是干什么的

RequestAdmissionConfig是模型请求准入的配置类。这个类做可选的进程级请求节流。节流按配额组共享。这个类控制每分钟请求数和排队行为。这个类继承自pydantic的BaseModel。extra为forbid。frozen不可变。

二、类的成员

（一）字段

- requests_per_minute：StrictIntFromEnv。必须大于0。strict模式。这个字段是每分钟请求数上限。StrictIntFromEnv让$VAR替换后的整数字符串也能通过校验。
- group：字符串或None。默认值是None。长度1到100。必须匹配[A-Za-z0-9_.-]+。这个字段是配额组名。同一组共享节流。
- max_wait_seconds：浮点数。默认值是300。大于0。这个字段是排队等待的上限秒数。
- max_queue_size：StrictIntFromEnv。默认值是256。必须大于0。这个字段是队列大小上限。

（二）方法

这个类没有自定义方法。frozen保证实例创建后不能被改。

三、它和谁协作

ModelConfig持有这个类。ModelConfig的request_admission字段的类型是这个类。修改活跃组的策略需要重启进程。

四、重要性评级

评级：5分。

理由：请求节流是可选的保护机制。默认不配置。但配置后它能平滑请求速率尖峰。所以重要性中等。
