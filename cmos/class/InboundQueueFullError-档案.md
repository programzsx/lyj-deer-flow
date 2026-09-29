# InboundQueueFullError档案

## 一、这个类是干什么的

InboundQueueFullError是入站队列已满的异常。

它是一个RuntimeError子类。

它表示有界的入站准入没有容量了。

MessageBus的入站队列有容量上限。

队列加预留的总数达到上限。

新的入站消息就无法接收。

这时总线抛这个异常。

而不是让生产者无限等待。

生产者捕获它，明确地丢弃这条消息。

过载行为因此变得可预测。

## 二、类的成员

### （一）方法

1、__init__()

继承RuntimeError的构造。

没有自定义字段。

异常消息里带容量数值。

## 三、它和谁协作

InboundQueueFullError是渠道体系的过载信号异常。

它由MessageBus抛出。reserve_inbound在容量耗尽时抛它。

它被Channel基类捕获。_reserve_inbound捕获它后返回None，表示明确丢弃。_publish_inbound_or_drop捕获它后返回False。

BuzzChannel也在处理中继事件时把它逃逸到重连循环，等入站有容量后靠中继历史重试。

它和InboundQueueClosedError、InboundReservationExpiredError是同级的三个入站异常。

它的出现代表过载，不是停机。

## 四、重要性评级

评级：5分。

理由如下。

它是系统过载行为的边界。

没有它，过载时的入站消息会无限等待或堆积。

它让生产者能明确区分"满了"和"关了"。

它只是一个信号异常，没有字段，没有行为。所以只有5分。
