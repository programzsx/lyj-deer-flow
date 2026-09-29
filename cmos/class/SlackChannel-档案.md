# SlackChannel档案

## 一、这个类是干什么的

SlackChannel是Slack平台的渠道实现。

它用Slack的Socket Mode连接Slack。

WebSocket方式。

不需要公网IP。

它的工作内容是这样的。

它初始化Socket Mode客户端。

在后台线程里连接Slack。

SDK收到Socket Mode事件后调用_on_socket_event。

渠道确认事件。

处理message和app_mention事件。

过滤机器人消息和白名单用户。

处理connect命令。

发布入站消息到总线。

它订阅出站消息，把回复发回Slack。

回复用markdown转mrkdwn的转换器。

还带表情反应。

处理开始时加eyes反应。

完成时加白check_mark反应。

失败时加x反应。

它还支持按连接的凭证。

每个用户连接可以用自己的Slack令牌发回复。

## 二、类的成员

### （一）字段

1、_socket_client和_web_client

Socket Mode客户端和Web API客户端。

2、_loop

网关主循环。

SDK线程需要安全地提交工作到它。

3、_allowed_users

允许的用户id白名单。

4、_web_client_factory

Web客户端工厂。

测试可以注入。

5、_connection_web_clients

按连接缓存的Web客户端。

键是连接id，值是令牌加客户端。令牌变化时重建。

6、_bot_user_id

机器人自己的用户id。

用于剥离提及文本。

### （二）生命周期方法

1、start()

启动渠道。

检查SDK安装和令牌。初始化Web客户端。创建Socket Mode客户端。订阅出站回调。在后台线程连接。

2、stop()

停止渠道。

取消订阅。清理跨线程提交。关闭Socket Mode客户端。

### （三）入站方法

1、_on_socket_event()

处理一个Socket Mode事件。

先确认事件。只处理events_api类型。从授权头解析机器人id。分发message和app_mention事件。

2、_handle_message_event()

处理一条消息事件。

过滤机器人消息。剥离机器人提及。处理connect命令。过白名单。识别命令类型。预留入站容量。加eyes反应。发运行回复。提交到主循环。

3、_publish_inbound_with_connection()

附加连接身份并提交入站消息。

### （四）出站方法

1、send()

发送回复。

markdown转mrkdwn。转义Slack保留字符。线程回复。完成后加白check_mark反应。失败加x反应。

2、send_file()

上传文件附件。

用files_upload_v2上传。

3、_get_web_client_for_message()

按消息选择Web客户端。

有连接id时用连接的凭证。凭证缓存复用。

4、_initialize_operator_web_client()

初始化操作员的Web客户端。

解析机器人用户id。

### （五）辅助方法

1、_add_reaction()和_add_reaction_with_client()

添加表情反应。

2、_send_running_reply()

发"处理中"回复。

3、_bind_connection_from_connect_code()和_post_connection_reply()

绑定处理和绑定回复。

4、_attach_connection_identity()

连接身份解析。

## 三、它和谁协作

SlackChannel是渠道体系的一个平台实现。

它继承Channel基类。复用基类的生命周期、重试、跨线程提交、入站预留设施。

它依赖slack-sdk库。Socket Mode客户端和Web API客户端都来自它。

它依赖markdown_to_mrkdwn转换库。

它依赖MessageBus。通过基类设施收发消息。

它被ChannelService实例化和管理。

它把InboundMessage发给ChannelManager消费。

## 四、重要性评级

评级：6分。

理由如下。

它是Slack平台的完整渠道实现。

它的Socket Mode连接不需要公网IP。

它的表情反应链路（eyes、check_mark、x）给了用户清晰的状态反馈。

它支持按连接的凭证，多用户可以各自绑定。

它的文本转义处理了Slack的提及和链接语法注入风险。

它只在配置了Slack的部署里生效。逻辑模式和其他渠道高度相似。所以只有6分。
