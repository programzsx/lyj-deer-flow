# ContextCompactionObserver档案

一、这个类是干什么的

ContextCompactionObserver是上下文压缩观察者的协议类。这个类是Protocol。实现这个协议的扩展可以观察每次上下文压缩。这个类定义一个回调方法。

二、类的成员

（一）方法

- on_context_compacted(app_store, task_store, event)：异步回调。压缩发生时宿主调用。app_store和task_store是ExtensionData。event是CompactionEvent。默认实现返回None。保证向后兼容。

三、它和谁协作

ExtensionRegistry的context_compaction_observer方法接收实现这个协议的对象。CompactionEvent和ExtensionData是回调的参数类型。宿主在压缩发生时调用回调。

四、重要性评级

评级：5分。

理由：这个协议是压缩观察的契约。实现它需要扩展遵守契约。但协议本身只有一个方法。所以重要性中等。
