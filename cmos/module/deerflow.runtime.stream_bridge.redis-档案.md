# deerflow.runtime.stream_bridge.redis-档案

## 一、这个模块是干什么的

这个文件是流桥的Redis Streams实现。

每个run的事件存进一个Redis Stream。订阅者用XREAD直接读。

这让SSE桥可以跨多个Gateway worker进程使用。同时保留Last-Event-ID重放语义。

supports_cross_process是True。这和memory桥相反。

## 二、模块里的主要成员

### 1、常量

_KIND_EVENT和_KIND_END是内部字段类型。区分普通事件和结束标记。

_REDIS_STREAM_ID_RE是Redis流id的正则。格式是毫秒-序号。

_XREAD_COUNT是XREAD的批量大小。64。一次读多个条目把大的重连重放合并成更少的调用。实时尾随仍然逐事件yield。消费循环遇到结束标记中途返回。

_MAX_SUBSCRIBE_RETRIES是订阅期间容忍的最大连续瞬时Redis错误数。3。短暂的抖动用指数退避重试。退避上限是heartbeat_interval。

### 2、RedisStreamBridge类

这个类继承StreamBridge。

#### （1）初始化

保存redis_url、容量、键前缀、TTL。

每个活跃的SSE订阅者持有一个池化连接。阻塞在XREAD BLOCK上。最长等heartbeat_interval。max_connections限制这个池。None保持redis-py的无上限默认。

owns_client标记是否拥有客户端。外部传入的客户端不由桥关闭。

#### （2）publish发布

发布一个事件。

_xadd_retained写进流。maxlen限制保留条数。approximate是False。精确截断。

有TTL时用pipeline。事务里写XADD加EXPIRE。TTL是流的泄漏安全网。

publish_end发出结束标记。保留的条数是配置的数据事件数加一。结束标记多占一个位置。

#### （3）_read_retained_snapshot原子快照

这是订阅正确性的核心。

阻塞的XREAD不能参与Redis事务。所以实时订阅用这个非阻塞的原子快照保证正确性。阻塞读只作为唤醒信号。

pipeline事务里执行三个命令。XRANGE读最早保留条目。XREVRANGE读最新保留条目。XREAD读游标之后的条目。

这刻意增加了每次轮询三命令的pipeline。空闲时多一次往返。目的是保留边界的检查不能和读取竞争。

#### （4）subscribe订阅

订阅是异步生成器。

先解析起始流id。last_event_id是None从0-0开始。格式匹配的id直接用。格式不匹配的查最新条目。最新是结束标记就从0-0开始。

gap检测只在有游标时启用。

主循环分几步。

第一步。处理挂起的初始响应。第一次阻塞XREAD是在证明空流之后开始的。它的响应是临时基线。不是客户端可见的数据。先验证基线再yield。

第二步。原子快照读取。ResponseError直接抛。Last-Event-ID是客户端控制的。已经验证过。Redis还拒绝id时失败而不是重置为0-0。重置会重放全部保留缓冲。RedisError计入连续错误。超过上限抛出。否则指数退避重试。

第三步。gap检测。快照里最早id大于游标时说明落后了。yield StreamGap并返回。

第四步。处理响应。当前游标最新条目是结束标记时yield结束哨兵。否则用阻塞XREAD作为唤醒。唤醒失败yield心跳哨兵。唤醒成功且是第一次从空流读到的数据时挂起。等下一轮原子检查验证后再yield。

第五步。处理待处理和新读到的条目。逐个解码成StreamEvent或结束哨兵。结束哨兵终止。普通事件yield。

#### （5）cleanup和close

cleanup等delay后删除run的流键。

close关闭自己拥有的客户端。兼容aclose和close两种方法名。

## 三、它和谁协作

它继承runtime.stream_bridge.base里的StreamBridge。

它被runtime.stream_bridge.async_provider创建。配置type是redis时。

它被runtime.runs.worker调用。

它被多worker部署的Gateway SSE端点消费。

它依赖redis.asyncio包。包是可选依赖。

## 四、重要性评级

评级是7分。

理由是这个文件是多worker部署的流式桥。

多进程SSE的正确性依赖它的原子快照设计。

gap检测和保守的错误处理保护了重连不会重放错误数据。

不评更高分是因为它只在redis配置下启用。默认部署用memory桥。redis是可选依赖。
