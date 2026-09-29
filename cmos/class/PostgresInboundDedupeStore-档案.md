# PostgresInboundDedupeStore档案

## 一、这个类是干什么的

PostgresInboundDedupeStore是共享的Postgres后端去重存储。

它是InboundDedupeStore协议的共享实现。

它解决的是多副本部署的去重问题。

多个网关副本共享一个Postgres数据库。

一条webhook重新投递落在另一个副本上。

它也会命中同一张表。

所以跨副本的重复投递也能被丢弃。

它对应4120号issue的跨副本场景。

每条已投递的入站webhook在表里有一行。

键是渠道名、工作区id、chat_id、消息id的四元组。

## 二、类的成员

### （一）字段

1、_session_factory

SQLAlchemy的会话工厂。

测试里注入。否则从应用引擎懒加载。

### （二）方法

1、try_record(key)

尝试记录一个键，返回是否重复。

核心是一条原子条件upsert语句。

没有冲突，就是新行，插入成功，返回行，放行。

有冲突但旧行已过期，DO UPDATE刷新首次见见时间，返回行，放行。这相当于内存实现的"先淘汰过期条目再检查"，也尊重了10分钟上限。一个从未释放的过期键，比如手动重新投递，会被重新接收。

有冲突且旧行还在存活期内，WHERE条件失败，不更新，不返回行，判定为重复，丢弃。

单条语句行级锁定，没有TOCTOU窗口。两个副本竞争同一个过期键，只有一个能通过，另一个看到新行被丢弃。同一事务里还做懒清理，删除超过TTL的旧行。清理摊进正常流量，不需要后台任务。

故障时fail-open。数据库出错记日志并返回False，视为新投递放行。存储故障绝不能丢弃webhook，也不能给平台返回5xx。

2、release(key)

删除一个键。

处理失败时调用。故障时fail-open，键留给TTL过期。

## 三、它和谁协作

PostgresInboundDedupeStore是渠道体系的多副本去重实现。

它实现InboundDedupeStore协议。

它由make_inbound_dedupe_store工厂函数创建。数据库是Postgres时，auto或postgres配置都选它。

它被ChannelManager持有和调用。

它依赖应用的持久化引擎提供的会话工厂。

它和MemoryInboundDedupeStore是可互换的替代实现。

## 四、重要性评级

评级：6分。

理由如下。

它让多副本部署的跨副本去重成为可能。

它的单条条件upsert设计避免了并发竞争窗口。

它的fail-open策略保证存储故障不丢消息。

它只有6分，是因为它只在多副本加Postgres的部署里生效。默认的单副本部署用不到它。而且它的逻辑集中在一条SQL语句上，职责单一。
