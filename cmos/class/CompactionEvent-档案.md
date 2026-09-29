# CompactionEvent档案

一、这个类是干什么的

CompactionEvent是压缩事件的数据类。压缩指把多条消息替换成一条。摘要是破坏性的。N条消息离开上下文。一条摘要进入上下文。之后只有摘要存在。下游无法回答哪些消息变成了这条摘要。这个事件必须在映射还存在时发出。这个类是frozen dataclass。

二、类的成员

（一）字段

- transform_kind：字符串。这个字段是压缩变换的种类。
- transform_version：字符串。这个字段是压缩变换的版本。
- source_content_hashes：字符串元组。这个字段是被消费消息的规范内容哈希列表。
- output_content_hash：字符串。这个字段是产出摘要的规范内容哈希。
- compacted_message_count：整数。这个字段是被压缩的消息数。
- kept_message_count：整数。这个字段是被保留的消息数。

字段用规范内容哈希做键。不用生产者盖的标识键。宿主目前不铸造稳定的每消息身份。每条消息都有内容。哈希内容总是可用。

三、它和谁协作

ContextCompactionObserver的on_context_compacted回调接收这个类。哈希用canonical_hash计算。消费的陷阱是不要重哈希后文里的摘要投影。那个投影是HTML转义的有界渲染。哈希值和output_content_hash不相等。

四、重要性评级

评级：6分。

理由：这个事件是压缩溯源的唯一载体。消费者只能通过这个事件把摘要和原文关联。这个类丢失后溯源就永久丢失。所以重要性中等偏上。
