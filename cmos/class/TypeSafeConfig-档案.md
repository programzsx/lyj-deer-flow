# TypeSafeConfig档案

一、这个类是干什么的

TypeSafeConfig是TypeSafe（Jev）共享客户端的默认配置类。typesafe配置块是顶层的。每个消费者在自己的config里覆盖需要的内容。优先级是消费者config高于这个块。这个块高于内置默认。这个块是可选的。没有typesafe键时内置默认生效。这个类继承自pydantic的BaseModel。strict模式是刻意的。

二、类的成员

（一）字段

所有字段都是可选的。

- api_key：字符串或None。默认值是None。API密钥。建议用api_key_env。密钥写在配置文件里不安全。
- api_key_env：字符串或None。默认值是None。持有API密钥的环境变量名。默认TYPESAFE_API_KEY。
- base_url：字符串或None。默认值是None。API基础URL。
- model：字符串或None。默认值是None。要请求的模型。TypeSafe返回实际服务的版本。
- timeout：浮点数或None。默认值是None。每次请求的超时秒数。
- deadline_seconds：浮点数或None。默认值是None。整个评估的预算秒数。
- max_attempts：整数或None。默认值是None。每次评估的尝试次数。含第一次。只针对429、529和传输错误。
- retry_backoff：浮点数或None。默认值是None。尝试之间指数退避的基础秒数。

strict模式的原因是YAML的数字会走到和消费者config相同的辅助函数。lax模式下max_attempts为true会静默变成1。同一值在guardrails.provider.config下会被拒绝。strict模式让两种写法一致。

（二）方法

- connection_defaults：这个方法只返回这个块实际设置的字段。None表示未配置。用exclude_none导出。

模块级还有get_typesafe_config、load_typesafe_config_from_dict、reset_typesafe_config三个函数。这些函数管理模块级单例。

三、它和谁协作

AppConfig持有这个类。AppConfig的typesafe字段是这个类的实例。MemoryPrescreenConfig和MemorySignalClassificationConfig的提供者可以用TypeSafe实现。resolve_connection应用优先级规则。

四、重要性评级

评级：5分。

理由：这个块是可选的共享默认。没有它消费者用内置默认。strict校验保证了两处写法一致。所以重要性中等。
