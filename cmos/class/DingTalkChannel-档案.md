# DingTalkChannel档案

## 一、这个类是干什么的

DingTalkChannel是钉钉平台的渠道实现。

它用钉钉的Stream Push方式连接钉钉。

WebSocket长连接。

不需要公网IP。

它的工作内容是这样的。

它在一个专用线程里运行钉钉的Stream客户端。

SDK收到消息后交给回调处理器。

处理器再调用渠道的_on_chatbot_message。

渠道解析消息文本和附件。

发布入站消息到总线。

它订阅出站消息，把回复发回钉钉。

回复有两种方式。

普通方式是sampleMarkdown消息。

配置了card_template_id时用AI卡片。

AI卡片支持流式更新。

先创建卡片。

每次更新通过流式接口刷新同一张卡片。

它还处理入站文件。

图片和文档通过downloadCode下载。

落盘到线程的上传目录。

同步到沙箱。

## 二、类的成员

### （一）字段

1、_thread和_main_loop

SDK运行线程和网关主循环。

SDK回调在专用线程上，需要安全地提交到主循环。

2、_client_id和_client_secret

钉钉应用凭证。

3、_allowed_users

允许的用户id白名单。

4、_cached_token和_token_expires_at和_token_lock

缓存的访问令牌和过期时间和锁。

5、_card_template_id

AI卡片模板id。

配置了它，渠道进入AI卡片模式。

6、_card_track_ids和_card_repliers

卡片追踪id和回复器。

7、_incoming_messages

原始消息的暂存。

AI卡片创建需要原始消息。

8、_file_write_lock

文件写入锁。

串行化入站文件的落盘。

### （二）属性

1、supports_streaming

配置了卡片模板id时支持流式。

### （三）生命周期方法

1、start()

启动渠道。

检查SDK安装和凭证。订阅出站回调。开放跨线程提交入口。启动SDK线程。

2、stop()

停止渠道。

取消订阅。清理在途的跨线程提交。断开流客户端。清空暂存。等待SDK线程结束。

### （四）入站方法

1、_on_chatbot_message()

处理一条聊天机器人消息。

它在SDK线程上运行。提取文本和文件。先处理connect命令。再过白名单。识别命令类型。构造InboundMessage。预留入站容量。提交到主循环处理。

2、_extract_text()和_extract_files()

提取消息文本和文件描述符。

文本支持text和richText两种消息类型。文件支持图片消息、richText内联图片、文件消息三种。

3、receive_file()

下载入站文件。

每个文件描述符按downloadCode下载。落盘到线程上传目录。同步到沙箱。虚拟路径加到消息文本前面。失败的附件生成加载失败标记。

4、_receive_single_file()

下载单个文件。

规范化文件名。唯一命名。防符号链接写入。授权沙箱读取。同步到非本地沙箱。

5、_download_by_code()

用downloadCode换取文件字节。

先换下载URL，再下载内容。流式下载带大小上限。

### （五）出站方法

1、send()

发送回复。

AI卡片模式下流式更新已有卡片。卡片失败退回sampleMarkdown。普通模式直接发sampleMarkdown。

2、_resolve_routing()

解析出站路由。

区分群聊和单聊。

3、send_file()

上传文件附件。

先上传媒体，再按群聊或单聊发送。大小上限20MB。

### （六）钉钉API辅助方法

1、_get_access_token()

获取访问令牌。

带缓存和提前刷新余量。带锁防止并发刷新。

2、_send_text_message_to_user()、_send_text_message_to_group()、_send_p2p_message()、_send_group_message()

发送文本和markdown消息到单聊和群聊。

3、_adapt_markdown_for_dingtalk()

把markdown适配成钉钉有限的sampleMarkdown渲染器。

代码块转引用。表格转换。内联代码加粗。

### （七）AI卡片方法

1、_create_and_deliver_card()、_stream_update_card()

创建卡片和流式更新卡片。

2、_prepare_inbound()

入站准备工作。

附加连接身份。发送运行回复。提交预留的消息。

3、_attach_connection_identity()和_bind_connection_from_connect_code()和_send_connection_reply()

连接身份解析、绑定处理、绑定回复。

## 三、它和谁协作

DingTalkChannel是渠道体系的一个平台实现。

它继承Channel基类。复用基类的生命周期、重试、跨线程提交、入站预留设施。

它依赖dingtalk-stream SDK。SDK提供Stream Push客户端和AI卡片回复器。

它依赖钉钉的OpenAPI。令牌获取、消息发送、文件上传下载都通过HTTP调用。

它依赖MessageBus。通过基类设施收发消息。

它被ChannelService实例化和管理。

它创建_DingTalkMessageHandler作为SDK回调。

它把InboundMessage发给ChannelManager消费。

## 四、重要性评级

评级：6分。

理由如下。

它是钉钉平台的完整渠道实现。

它支持普通markdown和AI卡片流式两种回复方式。

它的入站文件下载、落盘、沙箱同步链路完整。

它的安全处理细致。文件名规范化、downloadCode字符集限制、防符号链接写入。

它只在配置了钉钉的部署里生效。逻辑模式和其他渠道高度相似。所以只有6分。
