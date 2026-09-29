# InboundReservation档案

## 一、这个类是干什么的

InboundReservation是一个预留的入站容量槽。

它在提供者把工作交给总线之前预留容量。

为什么需要它。

有些平台的SDK在自己的线程上调用DeerFlow。

这些线程调度身份和确认准备工作到网关循环之前。

先预留一个容量槽。

这样队列和那些调度的回调都有界。

一个预留必须恰好提交一次。

或者在finally块里释放。

## 二、类的成员

### （一）字段

1、_bus

总线实例。

2、_token

预留令牌。

是不透明对象。总线用它记账。

### （二）方法

1、commit(msg)

提交预留的消息。

必须在MessageBus的事件循环上调用。提交把消息放进队列。

2、release()

释放容量槽。

在还没有提交或关闭时释放。

## 三、它和谁协作

InboundReservation是渠道体系的容量预留凭证。

它由MessageBus.reserve_inbound创建并返回。

它被Channel基类持有。_reserve_inbound获取它。_commit_reserved_inbound提交它并释放。

它被跨线程的渠道子类使用。DingTalk、Slack、Telegram、Discord、WeCom等SDK回调线程先预留容量，再调度主循环的提交工作。

它和InboundQueueFullError配对。容量不足时预留失败，抛异常。

## 四、重要性评级

评级：6分。

理由如下。

它让跨线程投递的容量控制成为可能。

没有它，SDK回调线程调度的异步工作会绕过队列的容量上限。

它的提交恰好一次或释放的契约防止了容量泄漏。

它只是个小凭证对象。逻辑少。所以只有6分。
