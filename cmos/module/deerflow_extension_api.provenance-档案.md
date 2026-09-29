# deerflow_extension_api.provenance 档案

## 一、这个模块是干什么的

这个模块解决"一条消息是谁产的"。

DeerFlow的中间件链会注入和改写消息。日期提醒。召回的记忆块。压缩总结。持久上下文数据块。图片载荷。激活的技能正文。

这些消息到达模型调用边界时。产出它们的组件已经无法从消息本身辨认出来。

观察者只能从措辞猜。措辞一改。猜测就失效。

所以产出中间件自己盖戳。

键定义在这个契约包里。不定义在宿主里。

原因是。钉在这个契约版本上的扩展必须能依赖这个设施存在。只有共享的声明才能让这个依赖可检查。

值是普通字符串。不是枚举成员。这样更新宿主带来的未知产出方退化成不认识的字符串。不会变成导入错误。

## 二、模块里的主要成员

- `MESSAGE_CONTENT_KIND_KEY`。常量。值为`deerflow_content_kind`。这条消息"是什么"。

- `MESSAGE_PRODUCER_KIND_KEY`。常量。值为`deerflow_producer_kind`。哪个组件产的。

- `MESSAGE_PRODUCER_ENTITY_ID_KEY`。常量。值为`deerflow_producer_entity_id`。产出方的具体实体id。可选。

- `PROVENANCE_KEYS`。这个契约拥有的全部键。宿主把所有键当作服务端拥有。从不可信输入里剥掉调用者提供的值。

- `ContentKind`。消息种类枚举。middleware_injection、memory、durable_context、skill_body、image_payload。

- `MessageProvenance`。冻结数据类。三个字段的戳。

- `provenance_kwargs(content_kind, producer_kind, producer_entity_id)`。构建`additional_kwargs`片段。产出方合并进自己的消息。可选字段缺失时省略。不写成None。戳里不出现"值什么都没说"的键。

- `read_provenance(message)`。读消息上的戳。缺失或畸形返回None。两个必需字段都必须是存在的字符串。部分戳或类型错的戳按缺失处理。不按半个真相处理。观察者不会把半个真相记成事实。

## 三、它和谁协作

它是本包的独立模块。不依赖同包其他文件。

宿主的中间件是戳的生产方。注入消息时合并provenance_kwargs。

扩展和观察者是消费方。通过read_provenance读戳。

宿主的输入清洗逻辑依赖PROVENANCE_KEYS剥不可信输入。

## 四、重要性评级

评级是5分。

理由如下。

消息产出方归属是可观察性的基础。没有戳。观察者只能靠措辞猜。猜会失效。

"半个真相按缺失处理"的设计很讲究。部分戳不按事实记录。

键放在契约包而不是宿主。让扩展可以可靠依赖这个设施。

扣分原因。它是可选的标注设施。不标注系统照常运行。它影响的是可观察性而非正确性。
