# app.channels.wecom 档案

## 一、这个模块是干什么的

这个模块是DeerFlow的企业微信接入通道。

这个模块把企业微信智能机器人平台和DeerFlow智能体连接起来。

用户在企业微信里发消息。

这个模块接收消息。

这个模块把消息交给DeerFlow处理。

DeerFlow处理后产生回复。

这个模块把回复发回企业微信。

这个模块使用WebSocket方式连接企业微信。

WebSocket方式不需要公网IP。

这一点对个人部署很重要。

这个模块依赖外部SDK`wecom-aibot-python-sdk`。

SDK的WebSocket客户端负责收发帧。

这个模块支持流式回复。

流式回复用`reply_stream`。

一条流承载整个回复。

这个模块能收发图片和文件。

出站文件通过WebSocket分块上传。

这个模块还支持主动推送。

定时任务等没有回复帧的场景走markdown推送。

## 二、模块里的主要成员

### 1、模块级辅助函数

`_file_md5`计算文件MD5。

按1MB分块读取。

`_open_binary`打开二进制文件。

这两个函数是阻塞操作。

调用方都用`asyncio.to_thread`包装。

`_clip_to_byte_limit`把文本裁剪到UTF-8字节预算内。

裁剪从不在字符中间断开。

裁剪后带截断标记。

`_split_for_byte_limit`把文本切成限额内的块。

切块优先选换行边界。

这样markdown结构能活下来。

批量上限是`_WECOM_MAX_CHUNK_BATCH`，10条。

病态长文本不会全量切完再丢弃。

超限时尾部聚合成一条截断消息。

### 2、WeComChannel类

这个类是模块的核心。

这个类继承自`Channel`基类。

这个类实现了`start`、`stop`、`send`三个生命周期方法。

#### （1）协议常量

企业微信机器人协议限制消息内容20480字节。

这个限制对被动流回复和主动推送都生效。

常量是`_WECOM_MAX_CONTENT_BYTES`。

截断标记是`\n\n... (truncated)`。

#### （2）构造函数`__init__`

构造函数接收`bus`和`config`。

配置包含`bot_id`和`bot_secret`。

配置包含可选的`working_message`。

配置包含可选的`allowed_media_hosts`。

`allowed_media_hosts`是操作者配置的主机后缀白名单。

前导`*.`被剥掉。

`*.example.com`和`example.com`行为一致。

这个白名单给代理或镜像WeCom媒体的部署一个出口。

不用为所有人放宽硬编码模式。

manager侧的入站媒体门会合并这个白名单。

构造函数维护WebSocket状态。

`self._ws_frames`记录每条消息的原始帧。

出站回复和文件发送都要用原始帧。

`self._ws_stream_ids`记录每条消息的流ID。

`self._ws_send_locks`是每会话的发送锁。

`self._lifecycle_lock`串行化启动和停止。

#### （3）`start`方法

`start`方法用生命周期锁保护。

`start`方法检查`bot_id`和`bot_secret`。

`start`方法检查`wecom-aibot-python-sdk`是否安装。

`start`方法创建WS客户端。

`start`方法注册事件回调。

回调覆盖text、mixed、image、file消息。

还有error和disconnected事件。

`start`方法创建连接任务。

`start`方法订阅出站消息。

`_on_ws_task_done`记录连接任务失败。

失败信息提示检查网络代理和凭据。

#### （4）`stop`方法

`stop`方法用生命周期锁保护。

`stop`方法先取消连接任务。

`stop`方法再用`_begin_ws_shutdown`启动SDK关停。

SDK的连接任务只覆盖连接建立。

握手后SDK自己拥有一个接收任务。

关停要等待真正的异步接收任务清理。

这里有一个SDK版本坑。

wecom-aibot-python-sdk 1.0.2把disconnect改成同步。

SDK还丢弃了为`_async_disconnect`创建的任务。

所以这个模块手动做SDK的同步记账。

手动停心跳。

手动清pending消息。

再自己创建并持有`async_disconnect`任务。

`stop`方法用`asyncio.shield`等待清理完成。

调用方的取消仍然会传播。

但只在通道自己的清理完成后传播。

生命周期引用在finally里清理。

清理后才能安全重启。

#### （5）`send`和`_send_ws`方法

`send`方法检查WS客户端。

核心逻辑在`_send_ws`。

这个方法区分两种场景。

场景一有可回复的帧。

帧和流ID从入站时缓存的映射里取。

没有流ID就生成一个。

然后流式发送。

发送内容裁剪到20480字节。

流回复是一条流承载整个回复。

不能中途分块。

发送带重试。

场景二没有可回复的帧。

定时任务推送走这里。

整条文本按20480字节切成多条markdown消息顺序发出。

每会话有发送锁。

锁跨越整个批次。

manager工作线程是并发的。

两个长推送到同一会话会交错分块。

交错会破坏顺序契约。

锁是引用计数的。

没有发送者持有或等待时回收锁。

锁注册表不会随Gateway生命周期无限增长。

#### （6）入站处理方法

`_on_ws_text`处理文本消息。

文本和引用消息都提取。

引用消息附在文本后面。

`_on_ws_mixed`处理混合消息。

混合消息的条目可以是text、image、file。

文本条目拼接。

图片和文件条目提取URL和aeskey。

`_on_ws_image`处理图片消息。

`_on_ws_file`处理文件消息。

`_publish_ws_inbound`是共同的发布入口。

这个方法先检查消息ID。

没有ID直接丢弃。

然后检查`/connect <code>`绑定命令。

绑定先于其他检查。

然后识别命令。

然后构造`InboundMessage`。

`chat_id`和`topic_id`都取用户ID。

这样用户的会话保持在同一个线程。

然后缓存帧和流ID。

然后预留入站容量。

预留失败就回滚缓存。

预留成功后先发一条"Working on it..."流式回复。

再附加连接身份。

最后提交入站消息。

#### （7）`send_file`和`_upload_media_ws`

`send_file`发送出站附件。

只在最终消息时发送。

图片上限2MB。

文件上限20MB。

超限跳过。

必须有帧缓存。

上传用`_upload_media_ws`。

上传是WebSocket分块协议。

分块大小512KB。

分块数上限100。

流程分三步。

第一步发`aibot_upload_media_init`命令。

命令带类型、文件名、总大小、分块数、MD5。

拿到`upload_id`。

第二步循环发`aibot_upload_media_chunk`命令。

每个分块base64编码。

第三步发`aibot_upload_media_finish`命令。

拿到`media_id`。

然后构造回复体发送。

文件读取和MD5都是阻塞操作。

都用`asyncio.to_thread`包装。

`_send_ws_upload_command`调用SDK的媒体上传API。

SDK不直接暴露这个API。

所以这里用反射访问内部方法。

SDK版本不对时报错提示。

错误信息给出期望的SDK版本。

#### （8）连接绑定

`_bind_connection_from_connect_code`处理绑定命令。

消费一次性state。

state无效或过期时回复错误。

绑定成功调用`upsert_connection`。

`workspace_id`取`aibotid`。

#### （9）媒体主机白名单

`allowed_media_host_suffixes`属性暴露操作者配置的白名单。

manager侧的入站媒体门在读取时合并这个白名单。

WeCom媒体URL来自帧数据。

没有每通道的大小配置。

白名单包含`qq.com`后缀。

白名单还包含WeCom自己的COS桶形状。

桶名是用户自选的。

任何腾讯云账号都能注册相似的桶名。

所以数字后缀必须匹配已验证的WeCom自有APPID。

其他账号走操作者配置的后缀。

## 三、它和谁协作

### 1、它依赖谁

它依赖`app.channels.base`的`Channel`基类。

它依赖`app.channels.message_bus`的消息类型。

它依赖`app.channels.commands`的命令识别工具。

它依赖`app.channels.connection_identity`的身份解析。

它依赖外部SDK`wecom-aibot-python-sdk`。

配置来自config.yaml的`channels.wecom`段。

### 2、谁调用它

`app.channels.service`按配置创建并启动它。

`ChannelManager`通过消息总线投递出站消息。

manager消费入站消息里的帧提供的媒体URL。

下载时合并这个模块的白名单。

浏览器绑定流程的code由`app.gateway.routers.channel_connections`生成。

用户通过`/connect <code>`消息消费code。

## 四、重要性评级

### 1、评级

7分。

### 2、理由

这个模块是企业微信平台的完整接入层。

没有它，企业微信用户无法使用DeerFlow。

它覆盖入站、出站、流式回复、文件上传、用户绑定全链路。

它的字节限额设计很细。

20480字节限制对字符边界和换行边界都做了处理。

引用计数的每会话锁是精心设计的。

锁防止并发推送交错，又不无限增长。

它处理了SDK版本兼容坑。

1.0.2的同步disconnect需要手动记账。

文件收发的分块上传协议实现完整。

它不是全系统的中枢。

中枢是`manager.py`和`message_bus.py`。

企业微信在国内的使用面比个人微信和钉钉窄。

通道本身的独立影响相对小。

文件约648行，逻辑规模中等。

所以评7分。
