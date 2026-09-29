# WeComChannel档案

## 一、这个类是干什么的

WeComChannel是企业微信平台的渠道实现。

它用wecom-aibot-python-sdk连接企业微信。

WebSocket方式。

它的工作内容是这样的。

它在网关主循环上启动SDK的WebSocket客户端。

注册文本、混合、图片、文件等消息回调。

SDK收到消息后调用对应的回调。

渠道解析消息文本和附件。

处理connect命令。

发布入站消息到总线。

它订阅出站消息，把回复发回企业微信。

回复有两种方式。

有可回复的帧时用流式回复。

reply_stream刷新同一条回复。

没有可回复的帧时，比如定时任务推送。

把全文拆成多条顺序的markdown消息发送。

每条消息有字节上限。

它还处理附件上传。

通过WebSocket的分块上传接口上传媒体。

## 二、类的成员

### （一）字段

1、_bot_id和_bot_secret

企业微信机器人凭证。

2、_ws_client

SDK的WebSocket客户端。

3、_ws_task和_ws_shutdown_task

连接任务和关闭任务。

4、_lifecycle_lock

生命周期锁。

串行化每个实例的start和stop。

5、_ws_frames和_ws_stream_ids

原始帧和流id的暂存。

键是消息id。出站回复需要原始帧和流id。

6、_ws_send_locks和_ws_send_lock_users和_ws_send_locks_guard

按聊天的发送锁和使用计数。

两条长推送到同一聊天时不能交错。锁引用计数归零后回收。

7、_working_message

"处理中"提示文本。

8、_allowed_media_host_suffixes

允许的媒体域名后缀。

### （二）属性

1、supports_streaming

支持流式回复。

2、allowed_media_host_suffixes

暴露媒体域名后缀。

管理器侧的入站媒体门合并这个配置。

### （三）生命周期方法

1、start()

启动渠道。

检查凭证。创建WebSocket客户端。注册消息回调。启动连接任务。订阅出站回调。

2、stop()

停止渠道。

取消连接任务。执行SDK的关闭操作。等待全部任务结束。清空帧和流id暂存。调用者的取消只在渠道自己的清理完成后传播。

### （四）入站方法

1、_on_ws_text()

处理文本消息。

保留引用消息。

2、_on_ws_mixed()

处理混合消息。

提取文本部分和图片、文件附件。

3、_on_ws_image()和_on_ws_file()

处理图片和文件消息。

4、_publish_ws_inbound()

发布入站消息。

暂存原始帧和流id。预留入站容量。先发"处理中"流式回复。附加连接身份。提交预留的消息。

5、_attach_connection_identity()和_bind_connection_from_connect_code()和_send_connection_reply()

连接身份解析、绑定处理、绑定回复。

### （五）出站方法

1、send()和_on_outbound()

发送回复。

覆盖了基类的_on_outbound，在最终消息后清理帧上下文。

2、_send_ws()

发送的内部实现。

有可回复帧时用流式回复。字节上限内裁剪。没有帧时拆成顺序markdown消息。按聊天加锁串行化整批。锁引用计数回收。

3、send_file()

上传文件附件。

只在最终消息时发送。图片2MB上限。文件20MB上限。

4、_upload_media_ws()

通过WebSocket分块上传媒体。

初始化上传。分块读取并上传。完成后拿media_id。

## 三、它和谁协作

WeComChannel是渠道体系的一个平台实现。

它继承Channel基类。复用基类的重试、入站预留、connect命令识别设施。它覆盖了_on_outbound来添加帧上下文清理。

它依赖wecom-aibot-python-sdk。WebSocket客户端、流式回复、媒体上传都通过SDK。

它依赖MessageBus。通过基类设施收发消息。

它被ChannelService实例化和管理。

它把InboundMessage发给ChannelManager消费。

它的媒体域名后缀被管理器侧的入站媒体门读取。渠道实例和manager模块协作收紧或放宽媒体下载的域名白名单。

## 四、重要性评级

评级：6分。

理由如下。

它是企业微信平台的完整渠道实现。

它的字节上限处理细致。流式回复裁剪。顺序推送拆分。都按UTF-8字节测量。

它的按聊天发送锁防止了两条长推送交错。

它的WebSocket媒体上传支持大文件分块。

它只在配置了企业微信的部署里生效。所以只有6分。
