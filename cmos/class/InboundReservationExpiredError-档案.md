# InboundReservationExpiredError档案

## 一、这个类是干什么的

InboundReservationExpiredError是预留已失效的异常。

它是一个RuntimeError子类。

它表示一个预留已经被提交过，或者已经被作废。

一个预留必须恰好提交一次。

重复提交同一个预留。

或者提交一个被停机作废的预留。

总线就抛这个异常。

## 二、类的成员

### （一）方法

1、__init__()

继承RuntimeError的构造。

没有自定义字段。

异常消息描述"inbound reservation is no longer active"。

## 三、它和谁协作

InboundReservationExpiredError是渠道体系的预留状态异常。

它由MessageBus抛出。_commit_inbound发现token不在活跃预留集合里时抛它。

它被Channel基类捕获。_reserve_inbound和_commit_reserved_inbound捕获它后记调试日志并返回None或False。

它和InboundQueueFullError、InboundQueueClosedError是同级的三个入站异常。

## 四、重要性评级

评级：3分。

理由如下。

它是预留契约的守护异常。

它防止同一个预留被提交两次，防止停机作废的预留被复活。

它的触发场景非常边缘。正常流程里预留只提交一次。所以它几乎只在bug或竞态时出现。

它只是一个信号异常，没有字段，没有行为。所以只有3分。
