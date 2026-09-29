# MessageBus档案

## 一、这个类是干什么的

MessageBus是渠道和智能体调度器之间的异步发布订阅枢纽。

它存在的目的只有一个。

解耦。

渠道不直接调用调度器。

调度器不直接调用渠道。

双方都只跟总线打交道。

消息流向是这样的。

渠道发布入站消息，消息进入一个有界队列。

调度器从队列里取消息。

调度器发布出站消息。

渠道通过注册的回调接收出站消息。

总线还有一层重要职责。

它管理入站准入。队列有容量上限。容量满时，新的入站消息会被明确拒绝，而不是无限等待。这让过载行为变得可预测。

它支持从SDK线程预留容量。有些平台的SDK在自己的线程上调用DeerFlow。这些线程可以先预留一个容量槽，再调度异步准备工作。

它管理关闭流程。关闭时拒绝新消息、作废未提交的预留、丢弃已排队未开始的消息。

## 二、类的成员

### （一）字段

1、_inbound_queue

入站消息的asyncio队列。

容量由构造参数指定，默认1000。

2、_inbound_admission_lock

入站准入的线程锁。

平台SDK的回调可能从任意线程预留容量，所以准入记账必须跨线程安全。

3、_inbound_queued

当前已入队的消息数。

4、_inbound_reservations

活跃预留的token集合。

预留和已入队消息加起来不能超过队列容量。

5、_accepting_inbound

是否还在接受入站消息。

关闭时置为False。

6、_full_rejection_count和_last_full_warning_at

容量拒绝计数和限流警告时间戳。

拒绝会累计计数。警告按每秒一次限流。

7、_outbound_listeners

出站消息的回调列表。

### （二）入站方法

1、publish_inbound()

立即接收一条消息，没有空间就抛异常。

它故意不用await的Queue.put。过载时生产者得到明确拒绝，不会积累无界的等待任务。开头的一次零延迟sleep是调度交接，让批量发布的生产者给固定工作协程留出取消息的机会。

2、reserve_inbound()

预留一个入站容量槽。

可以安全地从SDK线程调用。容量不足抛InboundQueueFullError。已关闭抛InboundQueueClosedError。

3、_commit_inbound()

提交预留的消息。

预留的token必须还有效。提交把消息放进队列。

4、_release_inbound_reservation()

释放预留。

5、get_inbound()

阻塞取出下一条入站消息。

6、get_inbound_nowait()

立即取出一条消息，不等待。

7、inbound_task_done()

标记一条消息处理完成。

8、join_inbound()

等待所有已入队的消息处理完成。

9、close_inbound()

拒绝新的入站，作废未提交的预留。

返回作废的预留数量。

10、open_inbound()

重新打开入站。

用于显式重启一个已停止的管理器。

11、discard_pending_inbound()

丢弃已排队但未开始的消息。

返回丢弃的数量。

### （三）出站方法

1、subscribe_outbound()

注册出站消息的异步回调。

2、unsubscribe_outbound()

注销回调。

3、publish_outbound()

把出站消息分发给所有注册的监听器。

单个监听器的异常被记录，不影响其他监听器。

### （四）属性

1、inbound_queue_maxsize

队列容量。

2、inbound_queue

暴露队列本身。

只用于只读的容量检查。

## 三、它和谁协作

MessageBus是渠道体系的消息中枢。

它被Channel基类持有。所有渠道子类通过基类调用它。

渠道调用publish_inbound或reserve_inbound发送入站消息。

渠道调用subscribe_outbound注册出站回调。

ChannelManager从它取入站消息，向它发出站消息。

它的异常类型InboundQueueFullError、InboundQueueClosedError被基类捕获处理。

它创建的InboundReservation被跨线程的渠道子类使用。

ChannelService在构造时创建它，并把队列容量配置传给它。

## 四、重要性评级

评级：9分。

理由如下。

它是渠道和调度器之间唯一的通信通道。

没有它，九个渠道和调度器会变成九对直接的耦合。

它的有界队列和准入控制决定了系统的过载行为。

它的预留机制解决的是跨线程投递的真实并发问题。

它的关闭流程决定了停机时消息不丢不挂。

它比ChannelManager低一分，是因为它只做消息搬运和容量控制。真正的业务决策都在调度器里。
