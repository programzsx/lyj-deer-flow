# MemoryInboundDedupeStore档案

## 一、这个类是干什么的

MemoryInboundDedupeStore是进程内的入站去重存储。

它是InboundDedupeStore协议的默认实现。

它用一个OrderedDict保存已见过的去重键。

它的目的只有一个。

防止平台重新投递同一条webhook消息导致智能体重复运行。

它保留了4120号issue之前的原始行为。

也就是说，它是向后兼容的基线实现。

单副本部署用它就够了。

多副本部署要换Postgres实现。

## 二、类的成员

### （一）字段

1、_ttl

去重键的存活时间。

默认600秒，也就是10分钟。

2、_max

最大条目数。

默认4096。

3、_store

OrderedDict存储。

键是去重键四元组。值是首次见到的时间戳。

### （二）方法

1、try_record(key)

尝试记录一个键，返回是否重复。

过期条目聚集在字典头部。因为键从不再插入，插入顺序就是时间顺序。所以先从头部弹出过期条目，再弹出超过容量的旧条目，都是O(k)操作，不用全量扫描。然后检查键是否存在。存在返回True。不存在记录时间戳并返回False。

2、release(key)

删除一个键。

处理失败时调用，让重新投递可以重试。

## 三、它和谁协作

MemoryInboundDedupeStore是渠道体系的默认去重实现。

它实现InboundDedupeStore协议。

它被ChannelManager在构造时默认创建。没有注入共享存储时，管理器就用它。

它由make_inbound_dedupe_store工厂函数创建。配置选memory或数据库不是Postgres时，用它。

它的键格式和ChannelManager._inbound_dedupe_key一致。

它和PostgresInboundDedupeStore是可互换的替代实现。

## 四、重要性评级

评级：5分。

理由如下。

它是默认部署的入站去重实现。

没有它，平台的webhook重试会导致智能体对同一条消息重复运行。

它的过期淘汰设计利用了插入顺序，效率高。

它只有5分，是因为它是单进程实现。多副本部署它就不够用了。而且它的逻辑简单，就是一个带TTL和容量上限的有序字典。真正的去重策略在管理器的键构造逻辑里。
