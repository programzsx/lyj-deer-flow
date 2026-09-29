# app.channels包档案

源码路径是backend/app/channels/__init__.py。

## 一、这个包是干什么的

app.channels包是IM渠道集成系统。

这个包把外部即时通讯平台连接到DeerFlow智能体。

支持的平台有Feishu、Slack、Telegram、Discord、钉钉、企业微信、微信、Buzz、GitHub。

用户在聊天软件里发消息。

消息经过渠道层进入DeerFlow。

DeerFlow的回复再经过渠道层发回聊天软件。

渠道通过langgraph-sdk的HTTP客户端和Gateway通信。

这一点和前端一样。

这样保证线程都在服务端创建和管理。

## 二、包里的主要成员

### 1、base.py

base.py定义了Channel抽象基类。

每个渠道都要实现start、stop、send三个方法。

start负责监听外部平台的消息。

stop负责优雅停止。

send负责把回复发回外部平台。

基类还提供线程安全提交机制。

Provider SDK的回调经常运行在专用线程上。

基类用_submit_threadsafe_coroutine把协程提交到Gateway的事件循环。

基类还提供入站预留机制。

_reserve_inbound预留有界的入站容量。

过载时明确丢弃消息。

基类还提供_send_with_retry。

这个方法按共享重试策略重试出站发送。

基类还提供receive_file。

子类可以覆写这个方法来下载入站文件附件。

### 2、message_bus.py

message_bus.py定义了MessageBus异步发布订阅枢纽。

渠道发布入站消息。

分发器消费入站消息。

分发器发布出站消息。

渠道通过注册的回调接收出站消息。

入站消息用asyncio.Queue承载。

队列默认容量是1000。

InboundMessage是入站消息的数据结构。

OutboundMessage是出站消息的数据结构。

### 3、manager.py

manager.py是核心分发器ChannelManager。

manager.py有将近3000行，是包里最大的文件。

ChannelManager消费入站队列。

对聊天消息，ChannelManager通过client.threads.create()创建线程。

首次创建用按键锁串行化。

锁的键是channel_name、chat_id、topic_id的组合。

这样防止一条迟到的消息绕过排队的创建者，把一个会话拆成重复线程。

Slack和Discord用client.runs.wait()等待完整回复。

Feishu和Telegram用client.runs.stream()做增量出站更新。

流内容有白名单规则。

只有assistant类型的消息才能变成展示文本。

这个白名单防止隐藏的模型上下文泄露到IM渠道。

ChannelManager还处理命令。

命令包括/new、/status、/models、/memory、/goal、/agent、/help。

ChannelManager还管理忙碌线程的后续消息缓冲。

### 4、service.py

service.py管理所有已配置渠道的生命周期。

service.py从config.yaml的channels键读取配置。

service.py实例化启用的渠道。

service.py启动ChannelManager分发器。

渠道注册表用惰性加载。

每个渠道名对应一个导入路径。

关闭时先关闭manager的准入。

传输层保持存活，直到所有manager工作线程退出。

### 5、store.py

store.py用JSON文件持久化会话映射。

映射键是channel_name:chat_id[:topic_id]。

映射值是thread_id。

所有对数据的访问都要加锁保护。

### 6、run_policy.py

run_policy.py保存全局CHANNEL_RUN_POLICY映射。

ChannelRunPolicy是每个渠道的运行策略描述符。

策略包含是否交互、递归上限、凭证提供者、是否fire-and-forget等开关。

渠道可以在导入时注册自己的策略。

新渠道的接入变成一行注册，不用改manager。

### 7、各平台实现文件

slack.py、feishu.py、telegram.py、discord.py、dingtalk.py、wecom.py、wechat.py、buzz.py、github.py。

每个文件是一个平台的Channel实现。

feishu.py在内存里跟踪运行中卡片的message_id，原地修补同一张卡片。

telegram.py支持流式更新，原地编辑"处理中"占位消息。

discord.py把跨循环调用限定超时，避免死掉的客户端永久挂起worker。

dingtalk.py可选启用AI卡片流式更新。

buzz.py是Nostr中继实现，用NIP-42认证的websocket。

github.py是webhook驱动的GitHub渠道。

### 8、辅助文件

dedupe_store.py做入站消息去重。

buzz_seen_events.py做Buzz已见事件的持久回放保护。

feishu_run_policy.py和buzz_run_policy.py注册Feishu和Buzz的运行策略。

sandbox_files.py处理非挂载沙箱的文件同步。

commands.py解析/connect等命令。

connection_identity.py处理连接身份。

runtime_config_store.py合并运行时渠道配置。

wechat_qr_login.py处理微信扫码登录。

buzz_nostr.py封装Nostr协议操作。

## 三、它和谁协作

上游是外部IM平台。

外部平台的消息经过各渠道实现进入MessageBus。

下游是Gateway的LangGraph兼容API。

ChannelManager用langgraph-sdk调用Gateway创建线程和运行智能体。

GitHub渠道的上游是app.gateway.routers.github_webhooks路由。

webhook路由验证HMAC后调用fanout_event发布消息。

渠道服务和Gateway的lifespan协作。

app.py在启动时调用start_channel_service。

app.channels依赖harness层的配置、持久化、文件IO工具。

## 重要性评级

评级是9分。

理由如下。

IM渠道是产品的重要入口。

用户不打开网页也能通过聊天软件使用智能体。

这个包支撑了9个平台的接入。

manager.py是整个包的核心枢纽。

所有聊天消息的线程创建、运行分发、回复投递都经过manager。

删除这个包等于砍掉所有IM集成能力。

所以评级是9分。

不评10分的原因是核心智能体运行不依赖渠道层。

渠道层不可用时网页端仍然完整可用。
