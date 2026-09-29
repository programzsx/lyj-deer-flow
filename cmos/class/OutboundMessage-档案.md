# OutboundMessage档案

## 一、这个类是干什么的

OutboundMessage是出站消息的数据类。

它代表一条从智能体调度器流回渠道的消息。

智能体处理完了用户的消息。

调度器把回复包装成OutboundMessage。

发布到MessageBus。

渠道的出站回调收到它。

渠道把回复发回外部平台。

它是整个渠道体系出站方向的统一数据格式。

和InboundMessage方向相反，配成一对。

## 二、类的成员

### （一）字段

1、channel_name

目标渠道名。

用于路由。

2、chat_id

目标会话标识。

3、thread_id

产生这条回复的DeerFlow线程id。

4、text

回复文本。

5、artifacts

智能体产出的工件路径列表。

6、attachments

已解析的附件列表。

是ResolvedAttachment列表。

7、is_final

是否是回复流的最终消息。

流式回复有多个中间更新，is_final为False。最后一条为True。

8、thread_ts

可选的平台线程标识。

用于线程回复路由。

9、connection_id

可选的DeerFlow渠道连接id。

用于连接级的出站凭证。

10、owner_user_id

拥有渠道连接的DeerFlow用户id。

11、metadata

任意附加数据。

12、created_at

消息创建的Unix时间戳。

## 三、它和谁协作

OutboundMessage是渠道体系的出站数据载体。

它由ChannelManager创建并发布。管理器在聊天回复、流式更新、错误回复、命令回复、身份拒绝时都构造它。

它被发布到MessageBus。总线把它分发给注册的出站回调。

它被Channel基类的_on_outbound回调消费。基类转发给子类的send和send_file。

九个渠道子类都接收它，把回复发回平台。

它的metadata携带飞书卡片预览、待澄清标记等渠道特有数据。

它和InboundMessage方向相反，配成一对。

## 四、重要性评级

评级：8分。

理由如下。

它是出站方向的统一数据格式。

没有它，调度器的回复要按九种平台格式分别发送。

它的is_final字段承载了流式回复的终止语义。

它的attachments字段承载了文件投递的关键数据。

它只是被动数据，没有任何行为。所以不到9分。
