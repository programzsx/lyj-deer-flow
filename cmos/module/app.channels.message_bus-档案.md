# app.channels.message_bus 档案

## 一、这个模块是干什么的

message_bus.py是IM通道系统的异步发布订阅枢纽。

它的名字是MessageBus。

它的作用是把通道实现和agent调度器解耦。通道不直接调用调度器。调度器不直接调用通道。两者都通过总线通信。

方向有两条。入站方向。通道发布`InboundMessage`进总线。消息进一个有界队列。调度器从队列消费。出站方向。调度器发布`OutboundMessage`到总线。总线把消息分发给所有注册的回调。通道通过回调收到回复。

入站队列是有界的。默认上限1000条。队列满时发布方得到显式拒绝，而不是无限等待。这防止过载时生产者积压无限的任务。

## 二、模块里的主要成员

### 1、消息类型

- `InboundMessageType`。入站消息类型枚举。`CHAT`是普通聊天。`COMMAND`是命令（如`/new`、`/status`）。
- `InboundMessage`。从IM平台到agent调度器的消息。字段包括`channel_name`（来源通道名）、`chat_id`（平台聊天id）、`user_id`（平台用户id）、`text`（消息文本）、`msg_type`（聊天还是命令）、`thread_ts`（平台线程id）、`topic_id`（话题id，映射到DeerFlow线程用）、`connection_id`（DeerFlow连接id，用户绑定时用）、`owner_user_id`（连接属主的DeerFlow用户id）、`workspace_id`（外部工作区id）、`files`（附件列表）、`metadata`（通道附加数据）、`created_at`（创建时间戳）。
- `OutboundMessage`。从agent调度器回通道的消息。字段包括`channel_name`（目标通道名，用于路由）、`chat_id`（目标聊天id）、`thread_id`（产生回复的DeerFlow线程id）、`text`（回复文本）、`artifacts`（产物路径列表）、`attachments`（解析好的附件）、`is_final`（是否是回复流的最后一条）、`thread_ts`、`connection_id`、`owner_user_id`、`metadata`、`created_at`。
- `ResolvedAttachment`。解析到宿主文件系统路径的附件。字段包括`virtual_path`（原始虚拟路径）、`actual_path`（解析后的实际路径）、`filename`、`mime_type`、`size`、`is_image`。

### 2、常量

- `DEFAULT_INBOUND_QUEUE_MAXSIZE`（1000）。入站队列默认容量。
- `PENDING_CLARIFICATION_METADATA_KEY`。待澄清状态的元数据键。
- `RESOLVED_FROM_PENDING_CLARIFICATION_METADATA_KEY`。从待澄清恢复的元数据键。
- `INBOUND_FILE_CONTENT_KEY`（`"_content"`）。适配器拥有的字节在跨通道边界时用的临时键。`ChannelManager`在持久化元数据前消费并移除它。Telegram照片和文档的字节就走这个键。

### 3、异常类

- `InboundQueueFullError`。有界入站准入没有容量时抛出。
- `InboundQueueClosedError`。关停期间入站准入已关闭时抛出。
- `InboundReservationExpiredError`。预留已被提交或失效时抛出。

### 4、InboundReservation类

一个在提供方把工作交给总线之前预留的容量槽位。

一些提供方SDK会在外部线程上调用DeerFlow。在外部线程预留容量，可以同时约束队列和随后调度到Gateway循环上的回调。预留必须恰好提交一次，或者在`finally`块里释放。

- `__init__(bus, token)`。持有总线引用和令牌。
- `commit(msg)`。在MessageBus的事件循环上提交预留的消息。
- `release()`。槽位未提交或未关闭时释放。

### 5、MessageBus类

#### （1）构造

- `__init__(inbound_queue_maxsize)`。创建有界`asyncio.Queue`。校验容量必须是正整数，布尔值被排除。用`threading.Lock`保护准入记账。因为提供方回调可能在SDK线程上预留。还维护预留集合、准入开关、满载拒绝计数和限频警告时间戳、出站监听器列表。

#### （2）入站路径

- `publish_inbound(msg)`。立即接纳消息或抛异常，绝不等待空间。刻意用"预留加`put_nowait`"而不是await的`Queue.put`。过载时生产者得到显式拒绝，不会积压无限的pending put任务。开头有一次零延迟sleep，这是调度交接，不是容量等待。让批量发布方（GitHub webhook扇出）给消费worker一个出队的机会。
- `reserve_inbound(msg)`。预留一个有界入站槽位。可安全地从SDK线程调用。在准入锁内检查准入开关、计算"已入队加预留"的总量、超量则计数并抛`InboundQueueFullError`。满载警告按1秒限频。
- `_commit_inbound(token, msg)`。在锁内校验令牌、移除预留、`put_nowait`入队、递增计数。令牌失效抛`InboundReservationExpiredError`。准入已关闭抛`InboundQueueClosedError`。
- `_release_inbound_reservation(token)`。释放未提交的预留。
- `get_inbound()`。阻塞等下一条入站消息。取出后在锁内递减已入队计数。
- `get_inbound_nowait()`。立即返回一条排队消息并释放准入容量。
- `inbound_task_done()`。标记一条出队消息已完整处理。
- `join_inbound()`。等待所有已入队条目完成或被丢弃。
- `close_inbound()`。拒绝新入站并作废未提交的预留。返回被作废的预留数。已排队消息保留到worker完成或`discard_pending_inbound`被调用。
- `open_inbound()`。已停止的管理器被显式重启时重新开放准入。
- `discard_pending_inbound()`。关停期间丢弃已排队但未开始的消息。返回丢弃数。

#### （3）出站路径

- `subscribe_outbound(callback)`。注册出站消息的异步回调。
- `unsubscribe_outbound(callback)`。移除已注册的回调。
- `publish_outbound(msg)`。把出站消息分发给所有注册的监听器。逐个await回调。单个回调的异常被记日志，不影响其他监听器。

## 三、它和谁协作

### 1、它依赖谁

- Python标准库。`asyncio`、`threading`、`time`、`collections.abc`、`dataclasses`、`enum`、`pathlib`。没有第三方依赖，也不依赖app内其他模块。

### 2、谁调用它

- 全部通道实现。`feishu.py`、`slack.py`、`telegram.py`、`discord.py`、`dingtalk.py`、`wecom.py`、`wechat.py`、`buzz.py`都通过`publish_inbound`发入站消息，通过`subscribe_outbound`收出站回复。
- `app.channels.github`的webhook路径。`fanout_event`把webhook事件扇出成多条`InboundMessage`。
- `app.channels.manager.ChannelManager`。调度器从`get_inbound`消费消息。处理后经`publish_outbound`发回复。
- `app.channels.service.ChannelService`。关停时调用`close_inbound`、`discard_pending_inbound`、`join_inbound`管理生命周期。

### 3、它在架构里的位置

总线是通道层和调度器层之间唯一的解耦点。通道代码不需要知道调度器怎么工作。调度器代码不需要知道各平台的SDK细节。所有跨边界的消息类型也定义在这里。

## 四、重要性评级

评级：9分。

理由：本模块是全部IM通道系统的中枢。所有通道的入站消息都从它过。所有回复都经它分发。消息总线一旦故障，Feishu、Slack、Telegram、Discord、钉钉、企业微信、微信、Buzz、GitHub全部通道同时不可用。`InboundMessage`和`OutboundMessage`是整个通道系统的核心数据契约。它的有界准入设计（预留加`put_nowait`）直接决定了过载时系统的行为：显式拒绝而不是无限积压。跨线程的预留机制也依赖它。代码量不到400行，却承载了整个通道系统的通信骨架。唯一不为它打满分的理由是它本身逻辑不复杂，没有认证、安全等高风险职责。所以评9分：核心枢纽，全通道依赖，但自身复杂度适中。
