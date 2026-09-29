# app.channels.dingtalk 档案

## 一、这个模块是干什么的

这个模块是DeerFlow的钉钉接入通道。

这个模块把钉钉聊天平台和DeerFlow智能体连接起来。

用户在钉钉里发消息。

这个模块接收消息。

这个模块把消息交给DeerFlow处理。

DeerFlow处理后产生回复。

这个模块把回复发回钉钉。

这个模块使用Stream Push方式连接钉钉。

Stream Push是WebSocket方式。

WebSocket方式不需要公网IP。

这一点对个人部署很重要。

这个模块支持AI卡片流式输出。

配置了`card_template_id`后，回复通过AI卡片流式更新。

用户一边看，DeerFlow一边生成。

这个模块还能收发文件。

用户可以发图片和文档给DeerFlow。

DeerFlow生成的文件也能发回给用户。

钉钉的markdown渲染能力有限。

这个模块会改写markdown。

改写后的markdown适配钉钉的sampleMarkdown渲染器。

## 二、模块里的主要成员

### 1、DingTalkChannel类

这个类是模块的核心。

这个类继承自`Channel`基类。

这个类实现了`start`、`stop`、`send`三个生命周期方法。

#### （1）构造函数`__init__`

构造函数接收`bus`和`config`两个参数。

配置包含`client_id`和`client_secret`。

配置包含可选的`allowed_users`。

配置包含可选的`card_template_id`。

构造函数维护令牌缓存。

`self._cached_token`缓存访问令牌。

`self._token_expires_at`记录过期时间。

`self._token_lock`防止并发刷新。

构造函数维护AI卡片状态。

`self._card_track_ids`记录每条消息对应的卡片ID。

`self._card_repliers`记录卡片对应的replier对象。

`self._incoming_messages`暂存原始入站消息。

`self._file_write_lock`串行化入站文件写入。

#### （2）`start`方法

`start`方法先检查`dingtalk-stream`库是否安装。

`start`方法检查`client_id`和`client_secret`是否存在。

配置了`card_template_id`时记录AI卡片模式开启。

`start`方法订阅消息总线的出站消息。

`start`方法启动专用线程。

线程里运行`_run_stream`。

#### （3）`stop`方法

`stop`方法停止通道。

`stop`方法先关闭入站提交口。

`stop`方法断开流客户端。

`stop`方法清理卡片状态和暂存消息。

`stop`方法等待线程退出，超时5秒。

#### （4）`send`方法

`send`方法把回复发回钉钉。

`send`方法先解析路由。

路由解析用`_resolve_routing`。

返回值是会话类型、发送者ID、会话ID。

群聊用会话ID路由。

单聊用发送者ID路由。

AI卡片模式下先尝试流式更新卡片。

卡片不存在时，非最终消息直接跳过。

跳过是为了避免重复消息。

卡片流式失败时降级为sampleMarkdown。

降级时最终消息发送完整文本。

非卡片模式直接发sampleMarkdown。

发送带重试。

重试用基类的`_send_with_retry`。

#### （5）`_on_chatbot_message`方法

这个方法是入站消息的入口。

流客户端收到消息后回调这里。

这个方法先提取文本和附件。

两者都为空就忽略。

然后检查`/connect <code>`绑定命令。

绑定命令先于`allowed_users`检查。

这一点和Telegram的逻辑一致。

然后检查用户是否在允许名单。

日志只记录消息长度，不记录内容。

这样消息文本不会进入INFO日志。

群聊里"@bot /new"这种消息会带提及符。

命令路径先去掉开头的提及符。

普通聊天保留提及符。

然后确定`topic_id`。

单聊`topic_id`为None，每个用户一个线程。

群聊`topic_id`为消息ID，每条消息开新话题。

空`chat_id`的消息直接丢弃。

空`chat_id`无法区分会话。

所有这类消息会共享一个线程和历史。

最后预留入站容量并提交处理任务到主循环。

#### （6）`receive_file`方法和`_receive_single_file`

这个方法下载用户发来的文件。

下载用`downloadCode`。

这是钉钉机器人OpenAPI的两步流程。

第一步用`downloadCode`换`downloadUrl`。

第二步下载`downloadUrl`的字节。

下载时流式读取，带50MB上限。

超限直接中止，不读完。

下载的字节写入线程上传目录。

写入前做几件事。

`download_code`是攻击者可控的数据。

fallback文件名先限制`download_code`为安全字符集。

平台文件名用`normalize_filename`清洗。

清洗失败用生成的安全名字。

写入时用`claim_unique_filename`防覆盖。

用`write_upload_file_no_symlink`拒绝符号链接。

写入加锁。

锁防止并发写互相覆盖。

写入后授权沙箱读取权限。

然后同步到非本地沙箱。

同步用`sync_file_to_thread_sandbox`。

同步失败返回空。

返回空意味着生成失败标记。

失败标记是`[failed to load ...]`。

这样用户知道发了文件但没读出来。

成功的附件把沙箱虚拟路径加到`msg.text`前面。

最后清空`msg.files`。

清空防止manager的URL下载路径重复抓取。

#### （7）AI卡片方法

`_make_card_source_key`从入站消息生成卡片键。

`_make_card_source_key_from_outbound`从出站消息生成同样的键。

两个键必须一致，出站才能找到对应卡片。

`_create_and_deliver_card`创建并投递卡片。

创建用`AICardReplier`。

`_stream_update_card`流式更新卡片内容。

用`replier.async_streaming`。

`append=False`表示覆盖式更新。

`is_finalize=True`表示结束。

#### （8）`_get_access_token`方法

这个方法获取钉钉访问令牌。

先查缓存。

缓存有效就直接返回。

缓存无效就加锁刷新。

刷新时二次检查缓存。

令牌提前300秒过期。

提前量是`_TOKEN_REFRESH_MARGIN_SECONDS`。

#### （9）出站发送辅助方法

`_send_text_message_to_user`发纯文本给单聊用户。

`_send_text_message_to_group`发纯文本给群聊。

`_send_p2p_message`发markdown给单聊。

`_send_group_message`发markdown给群聊。

markdown发送前先经过`_adapt_markdown_for_dingtalk`改写。

`_upload_media`上传媒体文件换取mediaId。

### 2、_DingTalkMessageHandler类

这个类是注册给dingtalk-stream的回调处理器。

`pre_start`把SDK客户端传给通道。

`raw_process`调用`process`并返回AckMessage。

`process`把回调数据解析成`ChatbotMessage`。

解析后把原始payload存在`_df_raw_data`上。

这一步很关键。

SDK不解析file类型的文档消息。

文件描述符要从原始payload里读。

然后调用通道的`_on_chatbot_message`。

### 3、模块级markdown改写函数

`_adapt_markdown_for_dingtalk`改写markdown。

钉钉sampleMarkdown不渲染管道表格。

`_convert_markdown_table`把表格转成引用列表。

每个单元格变成`> **表头**: 内容`。

`_FENCED_CODE_BLOCK_RE`把代码块转成引用块。

`_INLINE_CODE_RE`把行内代码转成加粗。

水平线转成Unicode横线字符。

`_display_filename`压缩空白并截断到80字符。

webhook数据直接嵌入消息文本会伪造路径行。

压缩是防这个的。

## 三、它和谁协作

### 1、它依赖谁

它依赖`app.channels.base`的`Channel`基类。

它依赖`app.channels.message_bus`的消息类型。

它依赖`app.channels.commands`的命令识别工具。

它依赖`app.channels.connection_identity`的身份解析。

它依赖`app.channels.sandbox_files`的沙箱文件同步。

它依赖`deerflow.config.paths`的路径工具。

它依赖`deerflow.uploads.manager`的上传写入工具。

它依赖`deerflow.sandbox.sandbox_provider`获取沙箱。

它依赖外部库`dingtalk-stream`和`httpx`。

配置来自config.yaml的`channels.dingtalk`段。

### 2、谁调用它

`app.channels.service`按配置创建并启动它。

`ChannelManager`通过消息总线投递出站消息。

manager还会调用它的`receive_file`下载入站文件。

浏览器绑定流程的code由`app.gateway.routers.channel_connections`生成。

用户通过`/connect <code>`消息消费code。

## 四、重要性评级

### 1、评级

8分。

### 2、理由

这个模块是钉钉平台的完整接入层。

没有它，钉钉用户无法使用DeerFlow。

它覆盖了入站、出站、流式卡片、文件收发、用户绑定全链路。

它处理了钉钉特有的两个难点。

难点一是markdown渲染受限，需要改写。

难点二是SDK不解析文档消息，需要读原始payload。

文件收发的安全设计很完整。

文件名清洗、写入锁、符号链接拒绝、大小上限都在。

它不是全系统的中枢。

单独一个平台通道缺失，系统其他部分照常工作。

所以评8分。

文件约1148行，逻辑密度高。
