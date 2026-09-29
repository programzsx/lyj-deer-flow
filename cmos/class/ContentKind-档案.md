# ContentKind档案

一、这个类是干什么的

ContentKind是消息内容种类的枚举类。这个类继承自StrEnum。这个类表示一个盖了戳的消息是什么。独立于哪个组件产的。

二、类的成员

（一）枚举值

- MIDDLEWARE_INJECTION：值为middleware_injection。中间件注入的内容。
- MEMORY：值为memory。回忆的记忆块。
- DURABLE_CONTEXT：值为durable_context。持久上下文数据块。
- SKILL_BODY：值为skill_body。激活的技能正文。
- IMAGE_PAYLOAD：值为image_payload。图片载荷。

（二）方法

StrEnum提供的能力。没有自定义方法。

三、它和谁协作

MessageProvenance的content_kind字段用这个枚举。provenance_kwargs把枚举值转成字符串写入消息。

四、重要性评级

评级：4分。

理由：这个枚举只有五个值。是溯源的种类标记。所以重要性偏低。
