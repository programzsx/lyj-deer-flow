# BuzzChannel档案

## 一、这个类是干什么的

BuzzChannel是Buzz平台的渠道实现。

Buzz是一个基于Nostr协议的中继工作区。

这个类让DeerFlow成为Buzz工作区的成员。

它的工作内容是这样的。

它维护一条到中继的NIP-42认证的WebSocket连接。

它接收kind-9聊天事件。

聊天事件要过好几道门。

公钥白名单。

提及要求。

私信和已参与的线程豁免。

通过门的事件包装成InboundMessage发布到总线。

它订阅出站消息，把回复发回Buzz。

它的回复方式很特别。

第一条消息是kind-9聊天事件。

后续更新通过kind-40003事件原位编辑那条消息。

这是流式回复。

它的订阅模型是按渠道的。

这是中继实际支持的形状。

每个连接做三件事。

用历史的kind-39000查询发现自己所属的渠道。

为每个发现的渠道开一个按渠道的聊天订阅。

保持一个活跃的成员通知订阅，让后来加入或退出的渠道不用重连就能感知。

中继的CLOSED帧会让订阅静默失效。

所以CLOSED会被恢复，而不只是被遗忘。

恢复有次数上限，且只在关闭原因表明重发同样的请求可能成功时才重试。

## 二、类的成员

### （一）字段

1、_relay_url

中继地址。

必须是ws://或wss://的URL。

2、_workspace_id

工作区id。

是中继地址的网络位置。一个中继对应一个社区。

3、_keys

Nostr密钥对。

在start()里解析，让coincurve依赖保持懒加载。

4、_allowed_users

允许的公钥白名单。

空集合意味着全部拒绝，这是故意的拒绝默认设计。

5、_require_mention和_mention_free

提及要求和免提及渠道集合。

6、_channel_meta

渠道元数据缓存。

来自远程的kind-39000事件，有容量上限。

7、_stream_targets和_stream_tails

流式回复的占位消息和溢出尾巴的追踪。

8、_seen_events

持久化的已处理事件记录。

防止重连后重复回答已回答的消息。

9、_seen_created_at

每个渠道的重订阅水位。

它只被完整处理过的事件推进。

10、_chat_subscriptions

当前连接上活跃的按渠道订阅集合。

11、_resubscribe_attempts

每个订阅的CLOSED恢复预算。

12、_auth_completed

本连接的NIP-42握手是否已被中继确认。

13、_pending_auth_challenge、_pending_auth_event_id、_session_started_at

认证挑战、待确认的AUTH事件id、会话开始时间。

14、_transport和_task

WebSocket传输和重连循环任务。

15、_stop_complete

清理是否完成。

传输准入和清理完成是分开的生命周期状态。停机超时被取消后，ChannelService可以重试清理。

### （二）生命周期方法

1、start()

启动渠道。

解析私钥。白名单为空时大声警告。订阅出站回调。启动重连循环。恢复已处理事件的持久化。

2、stop()

停止渠道。

取消重连循环并有限等待。清空所有按连接的状态。按渠道的水位故意保留，让重启从原地继续。最后冲刷已处理事件的持久化。

### （三）订阅方法

1、_chat_sub_id()和_chat_filter()

构造单个渠道的聊天订阅。

#h标签是中继扇出kind-9事件的唯一形状。since只在有本渠道水位时携带。

2、_discovery_filter()

发现订阅的过滤器。

历史的kind-39000查询。故意不额外过滤，中继自己按成员资格圈定范围。

3、_membership_filter()

成员通知订阅的过滤器。

订阅44100和44101事件。since锚定在连接时刻往前60秒。没有since，中继会把整个成员历史重放成新闻。60秒的松弛覆盖时钟偏差和握手期间发布的变更。

4、_ensure_chat_subscription()和_close_chat_subscription()

开启和关闭单个渠道的聊天订阅。

失败不会抛异常。订阅数有上限，超限时拒绝新订阅并记警告，而不是挤掉正在工作的订阅。

5、_handle_closed()和_recover_control_subscription()和_recover_chat_subscription()

处理中继的CLOSED帧。

认证前的auth-required是启动序列的正常部分，不是故障。永久原因不重试。临时原因在次数预算内重试。只有真正持有过的订阅才恢复，防止中继诱导订阅。

6、_claim_resubscribe_attempt()和_resubscribe_backoff()

重订阅预算和退避。

第一次重试立即执行。后续按1秒、2秒退避。预算按连接和认证纪元重置。

### （四）认证方法

1、_session()

运行一条连接的完整生命周期。

认证、发现、订阅、读帧。NIP-42认证是机会性的。控制订阅立即发出。收到AUTH挑战后签名发送AUTH事件，然后重新运行发现，因为认证前的请求可能已被拒绝。

2、_handle_auth_ok()

处理中继的OK确认。

只有AUTH事件id匹配的OK才能翻转认证完成标志。OK为false时大声记录拒绝。

3、_confirm_auth_if_pending()

认证确认的兜底。

中继可能不为AUTH发送OK。发现订阅的EOSE证明请求被服务了，也就是AUTH被接受了。

4、_run_loop()

重连循环。

指数退避上限60秒加随机抖动。连接真正建立后退避归零。

### （五）入站方法

1、handle_relay_frame()

处理一个原始中继帧。

这是所有入站帧的唯一入口。路由AUTH挑战、OK确认、EOSE、CLOSED、EVENT。每个EVENT先验签名再进处理器。

2、_handle_meta_event()

缓存渠道元数据。

d标签是渠道id，t是类型，name是名称。返回渠道id让调用者开启订阅。

3、_handle_membership_event()

处理成员变更通知。

p标签必须包含自己的公钥。被加入时先订阅再重新发现。被移除时取消订阅并删除元数据。

4、_handle_chat_event()

处理聊天事件。

按顺序过几道门。已处理事件去重。connect命令处理。公钥白名单。提及要求。然后包装成InboundMessage发布。

5、_advance_watermark()

推进渠道的重订阅水位。

每个渠道独立。拒绝未来时间戳，防止远程拒绝服务。

6、_bind_connection()和_reply_to_connect()

处理/connect绑定命令。

绑定结果完全确定后再发回复，发送失败不会误报为绑定失败。

### （六）出站方法

1、send()

发送回复。

第一条是占位聊天事件。后续更新原位编辑。超长文本分块，第一个块走占位，其余块走跟随消息。隐藏模型上下文包装的文本被直接拒绝发布。

2、_edit_or_repost()

原位编辑，失败后退化为发新消息。

3、_post_event()

投递一个已签名的事件。

传输为None时抛出异常。

## 三、它和谁协作

BuzzChannel是渠道体系的一个平台实现。

它继承Channel基类。复用基类的生命周期、重试、跨线程提交、入站预留设施。

它依赖buzz_nostr模块。模块提供纯函数的Nostr协议帮助，包括密钥解析、事件签名、验签、帧构造。

它依赖BuzzSeenEventStore。存储提供已处理事件的持久记录。

它依赖MessageBus。通过基类的设施发布入站消息、接收出站消息。

它被ChannelService实例化和管理。

它把InboundMessage发给ChannelManager消费。

它的运行策略在buzz_run_policy里注册。

它需要的buzz依赖extra提供coincurve和websockets。

## 四、重要性评级

评级：7分。

理由如下。

它是九个渠道实现里最复杂的一个。

它没有厂商SDK，重连、订阅管理、认证、恢复全部自己实现。

它的信任模型很严格。每个入站事件验签名。水位拒绝未来时间戳。白名单拒绝默认。

它有明确的已知边界。中继2000条历史上限导致的丢失路径被文档化。

它只在配置了Buzz中继的部署里生效。所以不到8分。
