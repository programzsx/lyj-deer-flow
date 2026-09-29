# deerflow_extension_api.compaction 档案

## 一、这个模块是干什么的

这个模块定义"上下文压缩事件"的契约。

压缩是一个破坏性变换。N条消息离开上下文。一条总结进入上下文。

之后只有总结存在。

下游没人能回答"哪些消息变成了这条总结"。映射消失了。

所以映射必须在还存在的时候发出去。

这个模块就是那个"必须趁还来得及的时候发"的事件契约。

## 二、模块里的主要成员

- `CompactionEvent`。冻结数据类。记录压缩消费了什么、产出了什么。趁两者都还在的时候捕获。

  - `transform_kind`和`transform_version`。变换的种类和版本。

  - `source_content_hashes`。被压缩消息的内容哈希。

  - `output_content_hash`。产出的总结的内容哈希。

  - `compacted_message_count`和`kept_message_count`。压缩数和保留数。

- `ContextCompactionObserver`。Protocol。`on_context_compacted(app_store, task_store, event)`。异步方法。宿主在压缩完成后调用。

- 内容哈希的配方。文档里写得很死。哈希必须用`canonical_hash(message.content)`。直接传content属性。不能先字符串化。因为DeerFlow的消息经常是多模态的list内容。对字典做str()会按插入顺序渲染。两条逻辑相同的消息会哈希出不同的值。canonical_hash内部已经做了规范化。先字符串化会把这层规范化扔掉。

- 消费者陷阱。文档警告。`DurableContextMiddleware`产出的durable_context_data块是summary_text的有界、HTML转义的投影。不是总结本身。哈希那个投影不会等于output_content_hash。消费者只能通过这个事件做关联。不能重新哈希后来的投影。

## 三、它和谁协作

它依赖同包的`state.py`拿ExtensionData。

它被`contracts.py`引用。Observer在注册表里注册。

宿主的上下文压缩路径是事实上的生产者。压缩完成时发事件。

实现Observer的扩展是消费者。

## 四、重要性评级

评级是4分。

理由如下。

它记录的是不可重建的信息。压缩映射一旦消失就永远消失。事件必须在真相存在时发出。

哈希配方的文档写得非常细。先字符串化还是直接传。这个细节决定两条消息的哈希能否对上。

它属于可选的观察性契约。没有扩展订阅时事件照样发出。没人消费。

扣分原因。它是低频事件契约。压缩不常发生。消费者是扩展而非核心链路。核心的正确性不依赖它。
