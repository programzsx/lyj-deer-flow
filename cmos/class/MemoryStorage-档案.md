# MemoryStorage档案

源文件位置：backend/packages/harness/deerflow/agents/memory/backends/deermem/deermem/core/storage.py

## 一、这个类是干什么的

这个类是记忆存储的抽象基类。

这个类定义了所有存储实现必须遵守的协议。DeerMem的记忆后端可以有多个存储实现。默认实现是FileMemoryStorage。可选实现是MarkdownMemoryStorage。第三方也可以提供自己的实现。所有实现都要继承这个类。

这个类用abc.ABC定义。核心读写方法是抽象方法。子类必须实现这些抽象方法。扩展方法是带默认实现的普通方法。子类可以选择性覆盖。

这个类是协议层。这个类不包含任何存储逻辑。上层代码只依赖这个类的接口。上层代码不依赖具体实现。

## 二、类的成员

### （一）抽象方法

子类必须实现。

- load：加载记忆文档。支持按智能体和用户隔离。
- reload：强制重新加载记忆文档。不走缓存。
- save：保存记忆文档。支持预期修订号检查。

### （二）带默认实现的方法

子类可以选择性覆盖。

- apply_changes：应用一个仓库变更集。默认实现抛NotImplementedError。提供者可以原子化覆盖。
- clear_all：清空一个用户的全局摘要和所有智能体事实桶。默认实现抛NotImplementedError。
- get_fact_usage：返回可选的查询使用量侧车数据。默认实现返回空字典。这个数据用于容量打分。
- record_fact_accesses：记录实际的查询命中。默认实现是空操作。
- record_capacity_eviction：持久化可选的元数据级淘汰证据。默认实现是空操作。
- clear_fact_metadata：删除选中事实或整个范围的侧车数据。默认实现是空操作。
- close：释放可选的存储资源。默认实现是空操作。

## 三、它和谁协作

- FileMemoryStorage是它的默认子类。子类实现文件存储。
- MarkdownMemoryStorage是它的容错子类。子类继承FileMemoryStorage。
- MemoryUpdater是它的主要消费者。更新器通过注入拿到这个类型的实例。更新器只调用这个类定义的接口。
- create_storage工厂函数按配置选择具体实现。工厂要求第三方实现必须继承这个类。
- MemoryManager是更上层的抽象。存储层位于Manager之下。

## 四、重要性评级

评级：8分。

理由：这个类是整个存储层的协议基类。所有存储实现都遵守这个类的接口。MemoryUpdater和上层调用方只依赖这个类。这个类的接口设计决定了存储层的可扩展性。没有这个类，存储实现就无法互换。但是这个类本身不含任何逻辑。协议基类的价值在于定义契约。
