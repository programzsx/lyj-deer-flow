# TelegramChannel档案

## 一、这个类是干什么的

TelegramChannel是Telegram平台的渠道实现。

它用python-telegram-bot库连接Telegram。

长轮询方式。

不需要公网IP。

它的工作内容是这样的。

它在一个专用线程里运行Telegram的轮询应用。

SDK收到更新后调用处理器。

渠道处理文本、照片、文档消息。

处理/start深链接绑定和已知命令。

发布入站消息到总线。

它订阅出站消息，把回复发回Telegram。

它的回复方式很特别。

先发一条"处理中"的占位消息。

后续更新通过editMessageText原位编辑那条消息。

这是流式回复。

群聊的编辑节流更严格，因为Telegram限制群聊每分钟20条消息。

最终回复支持Telegram的富消息。

只在文本包含富文本构造时才走富消息路径。

它还处理入站附件。

照片和文档下载后交给共享上传管道。

Bot API的下载URL带令牌，永远不外泄。

## 二、类的成员

### （一）字段

1、_application和_thread和_tg_loop和_main_loop

Telegram应用、轮询线程、Telegram循环、网关主循环。

2、_download_bot和_download_bot_lock

专用的下载Bot。

Application的Bot绑定在主循环上。下载Bot在Telegram循环上初始化，避免跨循环使用httpx连接池。

3、_tg_bridge_tasks

跨循环桥接任务。

只有Telegram循环修改这个集合。

4、_allowed_users

允许的用户id白名单。

5、_last_bot_message

每个聊天最后发送的消息id。

用于线程回复。

6、_stream_messages

在途流式消息的状态。

键是聊天加线程，值是消息id、上次编辑时间、上次文本。

### （二）属性

1、supports_streaming

支持流式回复。

### （三）生命周期方法

1、start()

启动渠道。

注册命令和消息处理器。在专用线程里运行轮询。轮询线程有自己的事件循环。

2、stop()

停止渠道。

清理跨线程提交。在Telegram循环上取消桥接任务并关闭下载Bot。停Telegram循环。等待轮询线程。整个停机在4秒预算内。

### （四）入站方法

1、_cmd_start()

处理/start命令。

带参数时先处理深链接绑定令牌，再过白名单。

2、_cmd_generic()

转发斜杠命令到渠道管理器。

3、_on_text()

处理普通文本、照片、文档消息。

保留媒体标题。提取附件。解析topic_id。预留入站容量。提交到主循环。

4、_extract_inbound_files()

提取入站附件描述。

照片取最大尺寸。文档保留元数据。

5、receive_file()

下载入站附件。

大小上限20MB。下载Bot在Telegram循环上初始化。下载的字节通过私有字段交给管理器。Bot API的令牌URL不外泄。

### （五）出站方法

1、send()

发送回复。

非最终消息走流式更新。最终消息处理占位消息或发新消息。富消息只在文本包含富文本构造时使用。

2、_send_stream_update()

原位编辑在途的流式消息。

按聊天类型节流。私聊1秒。群聊3秒。4096字符截断。

3、_finalize_stream_message()

应用最终文本。

编辑占位消息。超长文本拆成后续消息。

4、_edit_rich_message()和_send_new_rich_message()

富消息的编辑和发送。

富消息被拒绝时退回纯文本。

5、_send_new_message()

发新消息。

带重试和线程回复。

6、send_file()

上传文件附件。

照片10MB上限。文档50MB上限。

### （六）跨循环与辅助方法

1、_run_on_telegram_loop()

在Telegram循环上执行协程。

避免跨循环使用httpx客户端。

2、_track_telegram_bridge_task()和_cancel_telegram_bridge_tasks()

桥接任务的追踪和取消。

3、_shutdown_telegram_resources()和_shutdown_download_bot()

Telegram资源的关闭。

4、_bind_connection_from_start_token()

深链接绑定处理。

5、_attach_connection_identity()

连接身份解析。

6、_check_user()、_safe_inbound_filename()、_split_message()

白名单检查、安全文件名、消息拆分。

## 三、它和谁协作

TelegramChannel是渠道体系的一个平台实现。

它继承Channel基类。复用基类的生命周期、重试、跨线程提交、入站预留设施。

它依赖python-telegram-bot库。应用、Bot、更新处理都来自它。

它依赖MessageBus。通过基类设施收发消息。

它被ChannelService实例化和管理。

它把InboundMessage发给ChannelManager消费。

下载的附件字节通过message_bus的INBOUND_FILE_CONTENT_KEY临时字段交给管理器。

## 四、重要性评级

评级：7分。

理由如下。

它是Telegram平台的完整渠道实现。

它的流式回复通过editMessageText原位编辑实现，节流规则考虑了Telegram的群聊限速。

它的附件下载隔离了令牌URL，日志做了脱敏。

它的跨循环处理细致。下载Bot绑定在正确的循环上。桥接任务被追踪和清理。

它只在配置了Telegram的部署里生效。所以不到8分。
