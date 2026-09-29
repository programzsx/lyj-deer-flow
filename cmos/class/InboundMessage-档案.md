# InboundMessage档案

## 一、这个类是干什么的

InboundMessage是入站消息的数据类。

它代表一条从IM平台流向智能体调度器的消息。

用户在飞书发了一条消息。

用户在Slack发了一条消息。

渠道把这些消息都包装成InboundMessage。

然后发布到MessageBus。

调度器从总线取到的就是它。

它是整个渠道体系入站方向的统一数据格式。

九个渠道，九种平台格式。

全部归一成这一种。

## 二、类的成员

### （一）字段

1、channel_name

来源渠道名。

例如feishu、slack。

2、chat_id

平台特有的会话标识。

3、user_id

平台特有的用户标识。

4、text

消息文本。

5、msg_type

消息类型。

是InboundMessageType枚举，chat或command。

6、thread_ts

可选的平台线程标识。

用于线程回复。

7、topic_id

会话主题标识。

它决定消息映射到哪个DeerFlow线程。同一个chat_id内共享同一topic_id的消息复用同一个线程。为None时每条消息创建新线程，也就是一次性问答。

8、connection_id

可选的DeerFlow渠道连接id。

存在时，会话映射按连接隔离，而不是用旧的全局渠道加chat键。

9、owner_user_id

拥有渠道连接的DeerFlow用户id。

平台用户id保持在user_id里。

10、workspace_id

可选的外部工作区、服务器或团队id。

11、files

可选的文件附件列表。

每个元素是平台特有的字典。

12、metadata

渠道附加的任意数据。

13、created_at

消息创建的Unix时间戳。

## 三、它和谁协作

InboundMessage是渠道体系的入站数据载体。

它由Channel基类的_make_inbound工厂创建。

九个渠道子类都创建它。

它被发布到MessageBus的入站队列。

它被ChannelManager消费。管理器读它的字段决定线程映射、运行参数、路由。

它的metadata携带去重键、GitHub事件详情、飞书消息id等渠道特有数据。

它和OutboundMessage是方向相反的配对。它入站，OutboundMessage出站。

## 四、重要性评级

评级：8分。

理由如下。

它是入站方向的统一数据格式。

没有它，九个渠道的平台格式会直接流入调度器，调度器要处理九种形状。

它的topic_id、connection_id、owner_user_id等字段承载了线程映射和身份归属的关键语义。

它的metadata字段承载了去重和渠道特有数据。

它只是被动数据，没有任何行为。所以不到9分。
