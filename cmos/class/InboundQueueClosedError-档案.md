# InboundQueueClosedError档案

## 一、这个类是干什么的

InboundQueueClosedError是入站队列已关闭的异常。

它是一个RuntimeError子类。

它表示入站准入已经关闭。

通常发生在停机过程中。

停机时总线关闭入站。

这时渠道再想投递消息，总线就抛这个异常。

渠道捕获它，安静地丢弃消息。

因为停机中的投递本来就不应该被处理。

## 二、类的成员

### （一）方法

1、__init__()

继承RuntimeError的构造。

没有自定义字段。

异常消息描述"channel inbound intake is closed"。

## 三、它和谁协作

InboundQueueClosedError是渠道体系的停机信号异常。

它由MessageBus抛出。reserve_inbound和_commit_inbound在准入关闭时抛它。

它被Channel基类捕获。_reserve_inbound和_commit_reserved_inbound和_publish_inbound_or_drop捕获它后记调试日志并返回None或False。

它和InboundQueueFullError、InboundReservationExpiredError是同级的三个入站异常。

它的出现代表停机，不是过载。

## 四、重要性评级

评级：4分。

理由如下。

它是停机流程的正确性保障。

没有它，停机时渠道投递消息会表现为未处理的过载错误。

它让停机时的消息丢弃变得安静且可区分。

它只是一个简单的信号异常，没有字段，没有行为。所以只有4分。
