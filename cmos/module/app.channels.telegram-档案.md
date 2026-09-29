# app.channels.telegram 档案

## 一、这个模块是干什么的

这个模块是DeerFlow的Telegram接入通道。

这个模块把Telegram聊天平台和DeerFlow智能体连接起来。

用户在Telegram里发消息。

这个模块接收消息。

这个模块把消息交给DeerFlow处理。

DeerFlow处理后产生回复。

这个模块把回复发回Telegram。

这个模块使用long-polling方式连接Telegram。

long-polling方式不需要公网IP。

这一点对个人部署很重要。

这个模块支持流式输出。

流式输出的意思是DeerFlow一边生成回复，一边更新Telegram里的同一条消息。

用户不用等全部生成完。

这个模块还能收发文件。

用户可以发图片和文档给DeerFlow。

DeerFlow生成的文件也能发回给用户。

## 二、模块里的主要成员

### 1、TelegramChannel类

这个类是模块的核心。

这个类继承自`Channel`基类。

这个类实现了`start`、`stop`、`send`三个生命周期方法。

#### （1）构造函数`__init__`

构造函数接收`bus`和`config`两个参数。

`bus`是内部消息总线。

`config`是config.yaml里`channels.telegram`下的配置。

配置包含`bot_token`。

配置包含可选的`allowed_users`。

配置包含可选的`rich_messages`开关。

构造函数初始化多个内部状态。

`self._application`是python-telegram-bot的Application对象。

`self._thread`是专用轮询线程。

`self._tg_loop`是轮询线程自己的事件循环。

`self._main_loop`是Gateway主事件循环。

`self._download_bot`是专用于下载文件的Bot对象。

`self._allowed_users`是允许的Telegram用户ID集合。

`self._last_bot_message`记录每个会话最后一条bot消息的ID。

这个记录用来实现线程式回复。

`self._stream_messages`记录正在流式编辑中的消息状态。

`_stream_messages`有上限。

上限是`MAX_TRACKED_STREAM_MESSAGES`，值为256。

这个上限防止状态泄漏。

#### （2）`start`方法

`start`方法负责启动通道。

`start`方法先检查`python-telegram-bot`库是否安装。

`start`方法检查`bot_token`是否存在。

`start`方法注册命令处理器。

注册的命令包括`/start`、`/bootstrap`、`/new`、`/status`、`/models`、`/memory`、`/agent`、`/goal`、`/help`。

已知的斜杠命令注册为`_cmd_generic`。

未知的斜杠命令无法全部预先注册。

未知的斜杠命令走普通聊天处理路径。

`start`方法注册消息处理器。

文本消息走`_on_text`。

图片和文档消息也走`_on_text`。

图片和文档不匹配`filters.TEXT`，所以要单独注册。

Telegram的附件说明文字和`message.text`是分开的。

`_on_text`会把说明文字当作消息文本。

`start`方法启动一个专用线程。

专用线程里运行`_run_polling`。

轮询在自己的事件循环里跑。

#### （3）`stop`方法

`stop`方法负责优雅停止通道。

`stop`方法受5秒关停预算约束。

Gateway关停钩子只给5秒。

所以`TELEGRAM_SHUTDOWN_TIMEOUT_SECONDS`设为4秒。

`stop`方法先关闭入站提交口。

`stop`方法再在Telegram循环上执行资源清理。

资源清理包括取消跨循环任务。

资源清理包括关闭下载Bot。

`stop`方法最后停掉Telegram循环和轮询线程。

每一步都有超时保护。

超时只记警告，不抛异常。

#### （4）`send`方法

`send`方法负责把回复发回Telegram。

`send`方法区分流式更新和最终消息。

非最终消息走`_send_stream_update`。

最终消息优先走富文本路径。

富文本路径的条件有三个。

条件一是配置打开了`rich_messages`。

条件二是文本长度不超过32768。

条件三是文本包含富文本构造。

富文本构造指代码块、加粗、斜体、表格、任务列表、`<details>`、块级公式、链接。

检测用正则`_TELEGRAM_RICH_CONSTRUCT_RE`。

检测故意用"完整形态"而不是"包含某字符"。

例如表格必须是行首管道符。

例如链接必须是`[text](url)`形式。

这样`/goal [condition|clear]`这种命令不会被误判为富文本。

富文本通过Bot API 10.1的`sendRichMessage`发送。

富文本失败会回退到纯文本。

纯文本路径把超过4096字符的文本切块发送。

切块用`_split_message`。

#### （5）`_send_stream_update`方法

这个方法编辑正在流式输出中的那条消息。

首次调用先发一条新消息。

后续调用用`edit_message_text`原地编辑。

编辑有节流。

私聊最短间隔1秒。

群聊最短间隔3秒。

群聊限3秒是因为Telegram限制群聊每分钟20条消息。

编辑失败有降级策略。

"message is not modified"错误当作成功。

限流错误静默丢弃这次更新。

其他错误降级为发送新消息。

最终消息由manager保证会发。

所以中途丢弃的更新不会丢内容。

#### （6）`receive_file`方法

这个方法下载用户发来的附件。

下载前的检查有两个。

检查一是声明大小超过20MB就跳过。

20MB是Telegram托管Bot API的下载上限。

检查二是下载后的大小也再查一次。

下载成功后把字节放进`msg.files`。

字段的键是`INBOUND_FILE_CONTENT_KEY`。

这个键是临时字段。

manager消费完就丢弃。

这样带token的下载URL永远不会进入持久化数据。

下载失败的附件会生成一条说明。

说明附加在`msg.text`后面。

说明只写文件名和失败原因。

说明不写URL。

#### （7）`_run_polling`方法

这个方法在专用线程里跑轮询。

这个方法不能直接用`run_polling`。

因为`run_polling`会调用`add_signal_handler`。

`add_signal_handler`只能在主线程用。

所以这里手动初始化Application。

手动启动updater。

手动进入`run_forever`。

#### （8）`_cmd_start`和`_bind_connection_from_start_token`

`/start`命令带参数时是深度链接绑定流程。

绑定流程先于`allowed_users`检查执行。

这一点很重要。

浏览器发起的绑定，对应的Telegram身份可能还没被授权。

先执行绑定才能引导新身份完成授权。

绑定逻辑在主事件循环上执行。

因为SQLAlchemy会话绑定在主循环上。

#### （9）`_on_text`和`_cmd_generic`

这两个方法处理入站消息。

先检查用户是否在允许名单。

再提取文本和附件。

`topic_id`的规则分两种。

私聊`topic_id`为None。

私聊所有消息共享一个线程。

群聊`topic_id`取回复目标的消息ID。

群聊没有回复目标时取当前消息ID。

群聊每条新消息开一个新话题。

然后构造`InboundMessage`。

然后预留入站容量。

预留失败直接丢弃。

预留成功后把处理任务提交到主循环。

提交用基类的`_submit_threadsafe_coroutine`。

#### （10）`_extract_inbound_files`静态方法

这个方法从消息里提取附件描述。

图片取最大的那个尺寸。

文件名经过安全处理。

处理用`normalize_filename`和`is_upload_staging_file`。

文档消息有备选MIME类型。

备选类型是`application/octet-stream`。

避免在Telegram事件循环上做惰性MIME数据库查找。

#### （11）跨事件循环辅助方法

`_run_on_telegram_loop`让协程在Telegram循环上执行。

PTB的HTTP客户端绑定在自己初始化的那个循环上。

跨循环使用会报"bound to a different event loop"。

`_get_download_bot`创建专用的下载Bot。

这个Bot在Telegram循环上初始化。

它的连接池就和下载所在的循环绑定。

`_shutdown_download_bot`关闭下载Bot。

关闭也必须在原循环上做。

`_track_telegram_bridge_tasks`跟踪跨循环任务。

`_cancel_telegram_bridge_tasks`在循环退出前取消并清理这些任务。

#### （12）`_describe_download_cause`方法

这个方法生成token安全的失败原因描述。

HTTP客户端的异常文本可能带请求URL。

Bot API的URL路径里带token。

所以先删除配置的token。

再折叠剩余的Bot API URL。

只保留异常类名和原因链。

这样能区分超时、重置、TLS错误。

又不会泄漏token。

### 2、模块级辅助函数

`_has_rich_constructs`判断文本是否含富文本构造。

`_load_telegram_input_file`把文件包装成`InputFile`。

包装在线程池里做。

因为这个读取是阻塞操作。

## 三、它和谁协作

### 1、它依赖谁

它依赖`app.channels.base`的`Channel`基类。

基类提供重试策略和入站预留机制。

它依赖`app.channels.message_bus`。

`message_bus`提供`InboundMessage`、`OutboundMessage`、`MessageBus`等类型。

它依赖`app.channels.connection_identity`的`attach_connection_identity`。

这个函数把平台身份解析成用户连接记录。

它依赖`deerflow.uploads.manager`的文件名工具。

它依赖外部库`python-telegram-bot`。

配置来自config.yaml的`channels.telegram`段。

### 2、谁调用它

`app.channels.service`负责按配置创建并启动它。

`ChannelManager`通过消息总线向它投递出站消息。

入站方向是它向`MessageBus`发布消息。

`ChannelManager._dispatch_loop`从总线消费这些消息。

浏览器发起的绑定流程由`app.gateway.routers.channel_connections`生成一次性code。

Telegram用户通过`/start <code>`深度链接消费这个code。

## 四、重要性评级

### 1、评级

8分。

### 2、理由

这个模块是Telegram平台的完整接入层。

没有它，Telegram用户无法使用DeerFlow。

它的入站和出站链路都是核心功能。

它处理了流式编辑、富文本、文件收发、用户绑定等复杂场景。

这些场景都有明确的安全和稳定性设计。

token脱敏、大小限制、事件循环绑定都是必须正确处理的点。

它不是全系统的中枢。

中枢是`manager.py`和`message_bus.py`。

单独一个平台通道缺失，系统其他部分照常工作。

所以评8分而不是更高。

文件约1147行，逻辑密度高。

事件循环边界处理是全仓库中最精细的之一。
