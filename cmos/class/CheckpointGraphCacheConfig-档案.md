# CheckpointGraphCacheConfig档案

一、这个类是干什么的

CheckpointGraphCacheConfig是进程本地编译检查点图缓存的大小上限配置类。这个类和模式、快照节奏不同。这个类不要求重启。更大的上限只改变缓存何时淘汰。不改变图的语义。热加载的值在下次淘汰检查时生效。这个类继承自pydantic的BaseModel。

二、类的成员

（一）字段

- accessor_graph_max：整数。默认值是64。最小值是1。这个字段是网关缓存的编译线程状态访问器图的最大数。缓存按助手、频道模式和快照节奏做键。到达上限就整体清空。

（二）方法

这个类没有自定义方法。这个类只有一个字段。

三、它和谁协作

DatabaseConfig持有这个类。DatabaseConfig的checkpoint_graph_cache字段是这个类的实例。resolve_checkpoint_graph_cache_max函数读取这个字段。测试里的stub配置也能被该函数容忍。

四、重要性评级

评级：4分。

理由：这个类只控制缓存容量。是性能调优项。不改变图的语义。错了最多浪费内存或频繁重建图。所以重要性偏低。
