# ModelInvocationRequest档案

一、这个类是干什么的

ModelInvocationRequest是模型调用请求的数据类。扩展构造这个类向宿主请求一次文本模型调用。调用是提供者中立的。非流式。这个类是frozen dataclass。

二、类的成员

（一）字段

- messages：ModelMessage的序列。这个字段是调用的消息列表。构造时转成元组。
- model_role：字符串或None。默认值是None。这个字段是请求的逻辑角色。
- purpose：字符串或None。默认值是None。这个字段是调用的用途说明。
- response_schema：Mapping或None。默认值是None。这个字段是响应的schema。设置了就要求结构化输出。
- timeout_seconds：浮点数或None。默认值是None。这个字段是调用的超时秒数。

（二）方法

- __post_init__：这个方法把messages转成元组。保证快照不可变。

三、它和谁协作

ModelInvoker的invoke方法接收这个类。ModelMessage是messages字段的元素类型。ModelInvocationResult是调用的返回类型。

四、重要性评级

评级：5分。

理由：这个类是扩展请求模型调用的入口参数。字段清晰。宿主按它路由和校验。所以重要性中等。
