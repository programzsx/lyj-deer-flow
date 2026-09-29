# InboundDedupeStore档案

## 一、这个类是干什么的

InboundDedupeStore是入站webhook去重的异步协议。

它本身不是一个实现。

它是一个Protocol，也就是接口契约。

它定义了两个方法。

记录一个去重键。

释放一个去重键。

它存在的原因是这样的。

ChannelManager的入站去重防止平台重新投递导致智能体重复运行。

默认的存储是进程内的OrderedDict。

单副本部署够用。

多副本部署需要共享存储。

比如Postgres。

重新投递落在另一个副本上时也能被识别为重复。

所以需要一个统一的契约，让不同实现可以互相替换。

## 二、类的成员

### （一）方法契约

1、try_record(key)

尝试记录一个去重键。

返回True表示键已存在，也就是重复投递，应该丢弃。

返回False表示键是新记录的，或者旧记录已过期，可以继续处理。

共享状态的实现必须保证原子性。Postgres变体用单条条件upsert。

2、release(key)

释放一个去重键。

用于处理失败时放行重新投递。

### （二）类型别名

1、InboundDedupeKey

去重键的类型。

是四元组，渠道名、工作区id、chat_id、消息id。

## 三、它和谁协作

InboundDedupeStore是渠道体系的去重契约层。

它被ChannelManager持有和调用。管理器在入站去重时调用try_record，在处理失败时调用release。

它的两个实现是MemoryInboundDedupeStore和PostgresInboundDedupeStore。

make_inbound_dedupe_store工厂函数根据应用配置选择实现。

它定义的四元组键和ChannelManager._inbound_dedupe_key的返回值一致。

## 四、重要性评级

评级：6分。

理由如下。

它定义了入站去重的统一契约。

没有它，内存实现和Postgres实现无法互换。

它让多副本部署的跨副本去重成为可能。

它只有6分，是因为它只是接口。真正的去重逻辑在两个实现类里。而且单副本默认部署只用内存实现，感知不到这个契约的存在。
