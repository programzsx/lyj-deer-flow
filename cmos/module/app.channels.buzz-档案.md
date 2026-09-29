# app.channels.buzz 档案

## 一、这个模块是干什么的

buzz.py是Buzz平台的IM通道实现。

Buzz是一个基于Nostr协议的即时通讯平台。这个模块把DeerFlow接入一个Buzz中继（relay）。

这个模块让DeerFlow成为某个Buzz工作区的一个成员。用户在Buzz里发消息。消息经过这个模块进入DeerFlow。DeerFlow的回复再经这个模块发回Buzz。

底层是一条NIP-42认证的WebSocket长连接。NIP-42是Nostr的认证协议。

入站方向。中继会推送kind-9聊天事件。模块先做门控。门控包括公钥白名单、提及检查、私信检查、线程跟进检查。通过门控的消息会发布到内部消息总线。

出站方向。模块先发一条kind-9消息作为占位回复。之后的流式更新用kind-40003事件原地编辑这条消息。

订阅模型是频道级（channel-scoped）的。这是中继实际支持的形态。全局的`REQ {"kinds":[9]}`订阅会被接受但永远收不到事件。带单个`#h`标签的`REQ {"kinds":[9],"#h":[uuid]}`才有效。所以每个频道恰好一条聊天订阅。

每条连接会做三件事。第一，完成NIP-42认证。第二，用历史kind-39000查询发现自己所属的频道。第三，为每个发现的频道开一条`#h`聊天订阅。同时保持一条`kinds:[44100,44101]`的成员变更订阅。这样后续被加入或移出频道都不需要重连。

中继可以用一个`CLOSED`帧杀掉任何一条订阅。订阅死掉是静默故障。所以模块会恢复`CLOSED`的订阅而不是仅仅遗忘。恢复有`MAX_RESUBSCRIBE_ATTEMPTS`上限。

## 二、模块里的主要成员

### 1、模块级常量

- `EDIT_MAX_BYTES`（60000）。单次编辑内容的字节上限。留了余量，因为中继的kind-40003内容上限是64KB。
- `MAX_FUTURE_SKEW_SECONDS`（60）。允许对方提供的时间戳超前自己时钟的秒数。超限的时间戳不推进水位线。
- `MAX_CACHED_CHANNELS`（512）。kind-39000频道元数据缓存的容量上限。这个缓存是远端喂进来的，不设上限会无限增长。
- `MAX_CHANNEL_SUBSCRIPTIONS`（256）。单条连接持有的聊天订阅数量上限。到达上限时拒绝新订阅并记日志，不驱逐已有订阅。
- `MAX_RESUBSCRIBE_ATTEMPTS`（3）。单条订阅在单条连接内被`CLOSED`后重开的次数上限。
- `RESUBSCRIBE_BASE_DELAY_SECONDS`（1.0）。重订阅的退避基数。第一次重试立即执行，之后按1秒、2秒退避。
- `MEMBERSHIP_LOOKBACK_SECONDS`（60）。成员订阅的回看窗口。`since`锚定在连接建立时刻减去这个值。
- `STOP_TIMEOUT_SECONDS`（5.0）。`stop()`等待中继循环结束的上限。
- `DISCOVERY_SUB_ID`、`MEMBERSHIP_SUB_ID`、`CHAT_SUB_PREFIX`。订阅id。id是确定性的，目的是可以单独替换或关闭一条订阅而不影响同socket上的其他订阅。
- `_AUTH_REQUIRED_CLOSE_PREFIX`。NIP-42的"先认证"机器可读`CLOSED`前缀。
- `_PERMANENT_CLOSE_PREFIXES`。重发同样的REQ也不可能成功的`CLOSED`前缀集合。
- `_PERMANENT_CLOSE_MARKERS`。中继不用NIP-01前缀时的撤销/移除类散文标记。匹配是刻意收窄的。所有未匹配的理由默认按瞬时处理。
- `_CONNECT_REPLY_TEXT`。`/connect`回复文案。风格与其他兄弟适配器一致。

### 2、模块级函数

- `_chunk_text(text, limit)`。把文本按UTF-8编码后字节长度切成不超过limit的块。逐字符操作。多字节字符总是整体加入某一块。这从结构上杜绝了切开半个字符的损坏。
- `_is_auth_required_close(reason)`。判断`CLOSED`理由是否是NIP-42的"先认证"。
- `_hidden_context_marker(text)`。返回文本携带的隐藏上下文包装标记。标记包括`<memory>`、`<durable_context_data>`、`<system-reminder>`。
- `_is_transient_close(reason)`。判断重发同样的REQ是否可能成功。识别出的永久理由不重试。其他一切默认按瞬时处理。默认方向是"继续监听"。因为静默失聪是整个恢复机制要消灭的故障。

### 3、BuzzChannel类

BuzzChannel继承自`Channel`基类。

#### （1）初始化与生命周期

- `__init__(bus, config)`。解析`relay_url`（必须是ws://或wss://）。用中继主机名作为工作区id。工作区id用于入站去重、`/connect`连接行的写入和回查。解析`allowed_users`、`require_mention`、`mention_free_channels`。初始化流式占位映射、水位线映射、持久化的已见事件存储。
- `start()`。解析私钥。空白名单时打WARNING（Buzz默认拒绝，空白名单意味着所有消息都会被丢弃）。订阅出站回调。启动连接任务。
- `stop()`。取消中继循环并清理所有按连接计的状态。等待用`asyncio.wait`而不是`asyncio.wait_for`，保证超时后一定返回。流式占位、溢出尾巴、最近请求者、半消费的认证挑战、远端喂入的频道元数据、每频道订阅集合都会被清空。每频道的重放游标（`_seen_created_at`）刻意保留，重启后从原地继续。停止前await已见事件的最终flush。
- `_spawn_connection()`。创建名为`buzz-relay-loop`的asyncio任务。
- `_run_loop()`。拥有中继连接的整个生命周期。连接、跑一个会话、然后永远重试。指数退避上限60秒并加抖动。连接真正建立后退避计数归零。`CancelledError`立即向上抛。Buzz没有SDK，所以重连逻辑由这个循环自己持有，不像兄弟适配器那样委托给厂商SDK。

#### （2）订阅管理

- `_chat_sub_id(channel_id)`。生成某频道的确定性订阅id。
- `_chat_filter(channel_id)`。单频道聊天订阅的NIP-01过滤器。`#h`只带一个值。有水位线时附带`since`。"已处理"指接受并发布过的消息，不是单纯收到过的消息。这个规则让游标只会偏低。偏低只会带来重放，不会带来漏消息。已知边界：中继单订阅最多回放2000条历史事件，所以单频道断线期间积压超过2000条时最旧的会丢。
- `_discovery_filter()`。历史kind-39000查询。刻意不加`#p`收窄。加`#p`反而匹配不到任何东西，已在真实中继上验证过。
- `_membership_filter()`。指向自己的成员变更通知订阅。`since`是必需的。没有`since`会把整个成员历史当新闻重放。回看60秒是为了覆盖连接握手期间发生的成员变更和中继时钟偏差。
- `_open_control_subscriptions(ws)`。发送发现订阅和成员订阅这两条控制订阅。
- `_ensure_chat_subscription(channel_id)`。在当前连接上开某频道的聊天订阅。已开则跳过。永不抛异常。失败只会让该频道保持未订阅，由发现扫描或重连重试。
- `_close_chat_subscription(channel_id)`。停止监听一个频道。不影响同socket上的其他订阅。
- `_claim_resubscribe_attempt(sub_id)`。为某订阅花掉一次重试预算。预算用尽返回None。重订阅成功后计数不归零。只有socket或认证周期变化才整体重置。
- `_resubscribe_backoff(attempt)`。第一次立即，之后按1秒、2秒退避。退避在读循环里inline等待，不交给后台任务。
- `_handle_closed(sub_id, reason)`。把一个`CLOSED`帧路由到它需要的恢复路径。握手完成前的`auth-required:`是引导序列的正常环节，不是故障。这条分支优先于一切恢复路径，不消耗重试预算。其余按订阅id路由到控制订阅恢复或聊天订阅恢复。
- `_recover_control_subscription(sub_id, reason)`。重发被关闭的发现/成员REQ。永久理由不重试，并按不同理由分别记录。
- `_recover_chat_subscription(channel_id, reason)`。重开被关闭的频道聊天订阅。只对实际持有过的订阅做。频道先无条件从活跃集合移除。
- `_confirm_auth_if_pending()`。给不发`OK`的中继提供的NIP-42确认兜底。发现订阅到达EOSE本身就是AUTH被接受的证据。由中继自己的响应驱动，不靠墙钟。
- `_on_discovery_complete()`。发现订阅的EOSE处理。对整个元数据缓存做一次兜底扫描，重试中途失败的订阅。发现结果为空时打WARNING而不是静默。
- `_handle_auth_ok(event_id, accepted, message)`。处理中继对自己发出的AUTH事件的`OK`确认。只有精确匹配待确认事件id的`OK ... true`才允许翻转`_auth_completed`。`OK ... false`是大声记录的真实问题，绝不设置已认证标志。
- `_session(ws)`。跑一条中继连接的完整生命周期。设置transport、记录会话开始时间、清空每socket状态。NIP-42认证是机会式的。发现/成员REQ先发，收到`AUTH`挑战后再签名发送AUTH事件并重跑发现。finally里无条件清理。
- `_refresh_channel_discovery()`。在已有订阅id上重发发现REQ。原位替换订阅。

#### （3）入站处理

- `handle_relay_frame(raw)`。路由一个原始中继帧。这是全部中继输入的唯一入口。非JSON、形状不对、EVENT内部字段坏掉的帧都记日志并丢弃，不抛异常。所有EVENT都在这里做签名验证（`buzz_nostr.verify_event`），在任何处理器之前。这是唯一咽喉点，不留任何未验证事件到达授权决策的路径。`InboundQueueFullError`向上逃逸到`_run_loop`，让连接带着最后水位重开，等消息总线有容量后中继历史会重试。
- `_handle_meta_event(ev)`。缓存kind-39000频道元数据。`d`标签是频道id，`t`是类型，`name`是名称。返回频道id。元数据缓存FIFO封顶。信任假设是"作者"而非"真实性"：任何成员都能签名发布kind-39000，把频道标成DM可以放宽提及门槛，但不能绕过独立的公钥白名单。
- `_handle_membership_event(ev)`。处理kind-44100/44101成员通知。先本地复查`p`标签是否指向自己。被加入时先订阅再补跑发现。被移除时关闭订阅并删除元数据。
- `_is_dm(channel_id)`。只有元数据明确缓存为`type=="dm"`才返回True。失败方向是关闭（fail closed）。
- `_thread_root(ev)`。取`e`标签的第一个值作为线程根。
- `_strip_own_mention(text)`。剥掉单个无歧义的前导`@mention`。多个连续`@`开头的歧义前缀不猜，原样保留。
- `_advance_watermark(channel_id, created_at)`。推进本频道的重订阅游标。游标按频道独立，因为订阅也是按频道的。拒绝未来的时间戳。超限时间戳被忽略而不是钳制到上限。这是对远端拒绝服务攻击的防御。
- `_handle_chat_event(ev)`。处理kind-9聊天事件的主门控链。顺序是：忽略自己的事件，检查持久化的已见事件id去重，先于白名单处理`/connect <code>`绑定，公钥白名单检查，提及/私信/线程跟进检查，剥提及，构造`InboundMessage`并解析连接身份，发布到总线。只有完整接受并成功发布的消息才推进水位线和记录已见id。

#### （4）连接绑定与出站

- `_bind_connection(code, author, channel_id)`。消费`/connect`绑定码。总是完整处理请求。绑定成败先在try/except里完全决定并记日志，然后才发回复。
- `_reply_to_connect(channel_id, author, text)`。`/connect`结果的尽力而为回复。单次尝试，不重试。永不抛异常。
- `_post_event(event)`。只负责投递帧。每次调用时现读`self._transport`，绝不缓存旧引用。transport为None时抛`RuntimeError`。
- `_edit_or_repost(msg, target, content, now, label)`。原地编辑目标事件。重试耗尽后降级为发新消息。返回后续更新要指向的事件id。降级不重发mention，避免通知骚扰。
- `send(msg)`。出站主入口。先发一条kind-9占位消息。后续更新用kind-40003原地编辑。超长文本按`_chunk_text`切块。第一块走占位/编辑，其余块走线程内的后续kind-9消息。每个块索引都被跟踪，不只是第0块。因为管理器每次发布的是累计文本，只跟踪第0块会导致每轮更新都重复发尾巴消息。文本携带隐藏上下文包装标记时直接拒绝发布并记ERROR。这是管理器白名单之后的纵深防御。`finally`块在所有路径上清理流式记账。

## 三、它和谁协作

### 1、它依赖谁

- `app.channels.base.Channel`。父类。提供`_make_inbound`、`_pending_connect_code`、`_connection_repo`、`_on_outbound`、`_submit_threadsafe_coroutine`、`_send_with_retry`等框架能力。
- `app.channels.buzz_nostr`。Nostr协议工具层。提供密钥解析、事件构造（chat/auth/edit）、签名验证、标签提取、帧构造。
- `app.channels.buzz_seen_events.BuzzSeenEventStore`。持久化的已处理事件id存储。提供`aseen`/`arecord`/`aflush`/`quiesce`/`resume`。
- `app.channels.message_bus.MessageBus`。入站消息通过`publish_inbound`发布。出站通过`subscribe_outbound`/`unsubscribe_outbound`订阅回调。
- `app.channels.commands.is_known_channel_command`。判断文本是否是已知频道命令。
- `app.channels.connection_identity.attach_connection_identity`。按pubkey解析持久化的`/connect`绑定，填充`connection_id`和`owner_user_id`。
- `websockets`库。WebSocket客户端。运行时才惰性导入。

### 2、谁调用它

- `app.channels.service.ChannelService`。从`config.yaml`读取`channels.buzz`配置，创建并管理本通道的start/stop生命周期。
- `ChannelManager`。通过消息总线与本模块间接协作。管理器消费本模块发布的`InboundMessage`，并把`OutboundMessage`回调回本模块的`send()`。
- `Channel._on_outbound`。出站消息经父类回调最终进入`send()`。

### 3、它服务的用户流

用户在Buzz频道里@DeerFlow或发私信。消息变成kind-9事件。本模块门控后交给管理器。管理器在Gateway侧创建线程并跑agent。回复经`send()`以占位加原地编辑的方式流式发回Buzz。

## 四、重要性评级

评级：7分。

理由：本模块是Buzz（Nostr）平台的唯一通道实现。没有它，DeerFlow无法接入Buzz工作区。本模块承载了完整的订阅模型、NIP-42认证流、`CLOSED`恢复、重放游标、签名验证和流式编辑逻辑。这些逻辑是大量真实故障排查的产物，复杂度和防御深度都很高。但是Buzz是可选依赖（需要`buzz` extra），不是默认启用的通道。相比manager.py这样的核心调度器，本模块的故障只影响Buzz这一个平台，不影响其他IM通道和Web前端。所以评7分：在自己的领域内是关键且复杂的，但整体上是一个可选集成。
