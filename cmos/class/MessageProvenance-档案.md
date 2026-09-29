# MessageProvenance档案

一、这个类是干什么的

MessageProvenance是消息溯源的数据类。溯源记录谁产出了一个消息。中间件链会注入和改写消息。到了模型调用边界。产出消息的组件已经无法从消息本身恢复。所以生产者主动盖戳。这个类是frozen dataclass。

二、类的成员

（一）字段

- content_kind：字符串。这个字段是消息内容是什么。独立于哪个组件产的。
- producer_kind：字符串。这个字段是哪个组件产的。
- producer_entity_id：字符串或None。默认值是None。这个字段是生产者的具体实体ID。

（二）方法

这个类没有自定义方法。这个类是纯数据类。

三、它和谁协作

read_provenance构造这个类。provenance_kwargs构造additional_kwargs片段。ContentKind是content_kind的枚举来源。键在contracts包里声明。

四、重要性评级

评级：5分。

理由：这个类是消息溯源的标准载体。扩展观察者靠它识别消息来源。所以重要性中等。
