# SystemModelRequest档案

一、这个类是干什么的

SystemModelRequest是宿主自有模型调用前的只读快照数据类。观察者在调用前收到这个快照。这个类是frozen dataclass。

二、类的成员

（一）字段

- messages：Any的序列。默认值是空元组。这个字段是调用的消息。
- model_name：字符串或None。默认值是None。这个字段是模型名。
- invoke_config：Mapping或None。默认值是None。这个字段是调用配置。

（二）方法

- __post_init__：这个方法把messages规范化成元组。调用点不同。目标评估和记忆提取传消息列表。标题生成和摘要传一个提示字符串。裸字符串也是Sequence。不规范化观察者会逐字符遍历。拷贝列表让冻结的快照在事实上不可变。

三、它和谁协作

SystemModelCallObserver的on_system_model_call回调接收这个类。宿主在系统模型调用前构造快照。

四、重要性评级

评级：5分。

理由：这个类是系统调用观察的输入载体。规范化逻辑防止观察者误解内容。所以重要性中等。
