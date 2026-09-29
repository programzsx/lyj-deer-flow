# app.channels.manager 档案

## 一、这个模块是干什么的

这个文件是IM通道系统的核心调度器。

外部消息平台有飞书、Slack、Telegram、Discord、钉钉、GitHub等。

这些平台的消息先进入`message_bus`的入站队列。

这个模块从队列里取出消息。

然后这个模块调用DeerFlow的Agent来处理消息。

处理完之后，这个模块把回复发布回总线。

总线再把回复交给具体的通道，通道再回复到平台上。

这就是这个模块的全部职责。

这个模块的名字叫`ChannelManager`。

用户在飞书里发一句话。

这句话最终由`ChannelManager`转发给Agent。

Agent的回复最终由`ChannelManager`发回飞书。

中间的所有编排工作都发生在这里。

编排工作包括：

- 创建或复用LangGraph线程。
- 解析运行参数。
- 处理入站去重。
- 处理线程忙冲突。
- 处理命令消息。
- 处理流式回复。
- 管理并发和关闭。

## 二、模块里的主要成员

### （一）ChannelManager类

`ChannelManager`是本模块的主类。

这个类是整个IM通道系统的调度核心。

#### 1、生命周期方法

`start()`方法打开入站队列，并启动固定数量的worker任务。

worker数量默认是5。

worker是长期存在的任务。

worker从头到尾负责处理消息。

入站消息爆发时，消息在队列里排队。

系统不会为每条消息创建新任务。

`begin_shutdown()`方法关闭入站准入，但保留worker。

worker继续处理已经接收的消息。

`stop()`方法先排水，再取消所有任务。

关闭流程是这样的：

- 先关闭准入。
- 已接收的消息有3秒宽限期继续处理。
- 宽限期过了就取消worker。
- 跟进观察者任务立即取消。
- 观察者不是确认回执，所以不等宽限期。
- 最后丢弃队列里没开始处理的消息。

关闭成功意味着没有worker或观察者还能使用通道资源。

如果Gateway外层超时取消了关闭协程，传输层仍然挂在服务上，关闭可以重试。

#### 2、worker循环

`_worker_loop()`是每个worker的主循环。

循环做的事是这样的：

- 从队列取消息。
- 为每条消息建立独立的追踪上下文。
- 先做入站去重判断。
- 去重判断在打日志之前做。
- 这样提供商重试N次不会打出N条接收日志。
- 然后调用`_handle_message()`处理消息。
- 处理失败时释放去重键。
- 释放去重键是为了让提供商重投递可以重试。
- 任务被取消时也要释放去重键。
- 消息没处理完，TTL长的去重键不应该保留。

#### 3、入站去重

`_inbound_dedupe_key()`计算一条消息的去重键。

去重键是一个四元组。

四元组是通道名、工作区ID、聊天ID、消息ID。

消息ID只取服务端稳定的提供商消息ID。

客户端自己生成的ID不可靠。

提供商自己重投递时，客户端生成的ID可能不同。

用客户端ID做去重键，恰好会漏掉想吸收的重试。

工作区ID有多个候选来源。

候选来源依次是`workspace_id`、`team_id`、`guild_id`、`aibotid`、`conversation_id`。

没有工作区ID时，去重直接跳过。

这是失败关闭的设计。

没有工作区标识就无法区分两个工作区。

比如Slack的频道ID不是全局唯一的。

跳过去重比错误合并两个工作区的消息更安全。

`_is_duplicate_inbound()`用去重键查存储。

`_release_inbound_dedupe_key()`释放键。

默认的去重存储是进程内的内存存储。

内存存储重启后失效。

多副本部署可以注入共享的Postgres存储。

去重窗口是10分钟。

10分钟是刻意有界的窗口。

窗口足够吸收近期重投递。

窗口又不会让账本无限增长。

#### 4、消息分发

`_handle_message()`是消息处理的入口。

流程是这样的：

- 先应用生效的所有者身份。
- 非命令消息先做绑定身份检查。
- 没有绑定身份的消息被拒绝。
- 命令消息走`_handle_command()`。
- 聊天消息走`_handle_chat()`。
- 配置错误和技能解析错误发错误回复。
- 未知异常释放去重键并发送内部错误回复。

#### 5、绑定身份检查

`_get_bound_identity_rejection()`检查消息是否来自已绑定的身份。

这个检查是运行创建的安全边界。

检查逻辑是这样的：

- 未启用绑定要求时直接放行。
- Webhook认证的通道（GitHub）通过策略豁免。
- GitHub的真实性由HMAC在webhook路由层保证。
- 认证禁用的本地模式放行。
- 消息缺少`connection_id`或`owner_user_id`时拒绝。
- 然后从连接仓库按平台身份重新读取绑定。
- 重新读取的结果和消息声称的`connection_id`、`owner_user_id`比对。
- 不匹配就拒绝。

关键点是管理器不信任入站消息自带的身份字段。

身份字段可能被篡改。

所以要从服务端的连接仓库重读。

拒绝回复只携带服务端读到的字段。

#### 6、线程管理

`_get_or_create_thread()`查找或创建DeerFlow线程。

线程映射存在`store`里。

映射键是通道名加聊天ID加话题ID。

这里有一个并发问题。

每条消息在自己的任务上分发。

两条几乎同时到达的消息都可能查不到线程。

两条消息都可能去创建线程。

第二条会静默覆盖第一条。

一个Gateway线程被孤立，一个对话被拆成两半。

解决办法是按对话加锁。

锁用`AsyncKeyedLockTable`实现。

锁键是通道名、聊天ID、话题ID的三元组。

持锁者在锁内重新检查线程是否存在。

只有第一条消息创建线程，其余消息复用。

锁是等待者感知的。

参与者在等待前就登记。

当前创建者失败或取消，后来的调用者也不能绕过排队者用新一代锁。

`_create_thread()`通过Gateway创建线程。

创建时带通道元数据。

如果消息带了`preferred_thread_id`，就用这个确定性ID。

GitHub通道用这个特性。

同一个仓库加同一个issue号永远落在同一个线程上。

存储被清空后也是这样。

`ConflictError`的处理很讲究。

真正的并发创建冲突会触发409。

恢复流程是先用`threads.get`验证目标线程真的存在。

验证通过才缓存映射。

任何其他异常都向上传播。

旧代码把所有异常都吞掉，然后写入映射。

结果是后续的webhook永远404，没有重试路径。

新代码修复了这个问题。

#### 7、运行参数解析

`_resolve_run_params()`解析每次运行需要的参数。

返回值是assistant_id、运行配置、运行上下文。

assistant_id的优先级链是这样的：

- 消息元数据里的`assistant_id`或`agent_name`最高。
- 线程缓存的agent名次之。
- 用户层会话配置。
- 通道层会话配置。
- 默认会话配置。
- 最后是构造时传入的默认assistant_id。

自定义Agent的实现方式是lead_agent加`agent_name`上下文。

所以非默认的assistant_id会被规范化。

显式的选择会写入所有Gateway支持的载体。

显式的lead_agent选择也会清除所有载体里配置的agent。

这是为了让`/agent use lead_agent`真的能重置对话。

运行配置里的`configurable`会固定`checkpoint_ns`为空字符串。

还会固定`thread_id`。

通道触发的运行被钉在根图命名空间。

后续回合才能从同一个对话检查点继续。

运行上下文的身份部分有四个键。

`thread_id`是线程ID。

`channel_name`让图内代码判断工具是否安全暴露。

Webhook通道携带不受信的外部提示。

管理类工具如`update_agent`在webhook触发的运行里被丢弃。

`user_id`是DeerFlow账户身份。

`channel_user_id`是原始平台用户ID。

`user_id`由`_channel_storage_user_id()`解析。

浏览器连接的IM通道优先用连接所有者的DeerFlow账户。

这个解析器和文件存储用的是同一个辅助函数。

Agent读写的桶和通道文件暂存的桶永远一致。

递归上限也在这里应用。

通道策略的默认递归上限是一个下限。

取会话配置和策略默认值的较大者。

消息元数据里的每消息覆盖会原样生效。

覆盖值比通道默认小也生效。

一个只想审阅的agent可以配置`recursion_limit: 50`，真的在50步停下。

#### 8、通道策略应用

`_apply_channel_policy()`应用需要运行上下文的通道策略。

这个方法在`_resolve_run_params`之后、Agent运行之前调用。

策略覆盖两件事。

第一件事是非交互通道的`disable_clarification`。

不设这个标志，`ClarificationMiddleware`会让webhook运行死等一个同步回复。

同步回复只能作为稍后的另一次webhook投递到达。

运行会永远挂着。

第二件事是通道专属的凭证提供者。

GitHub通道安装了一个令牌铸造回调。

`bash_tool`每次调用都能解析到新鲜的安装令牌。

安装令牌比GitHub的1小时TTL长。

凭证提供者失败不会丢弃投递。

运行会继续。

只读回复比没有回复好。

#### 9、聊天处理

`_handle_chat()`是聊天消息的主流程。

流程是这样的：

- 做绑定身份检查。
- 拿到SDK客户端。
- 解析存储所有者。
- 查找或创建线程。
- 复用已有线程时，补写通道元数据，加载线程的agent选择。
- 开始同线程串行化。
- 排队时先发布排队提示。
- 拿到串行锁后再发布thinking提示。
- 然后调用`_handle_chat_on_thread()`。
- 最后在finally里释放串行状态。

`_handle_chat_on_thread()`是单线程上的聊天处理。

流程是这样的：

- 解析运行参数。
- 应用通道策略。
- 有附件时让通道下载附件。
- 下载后`msg.text`会带上沙箱文件路径。
- 模型就能按路径访问用户上传的文件。
- 摄取入站文件到上传目录。
- 构造人类消息。
- 按通道能力分流。

分流有三个去向。

支持流式的通道走`_handle_streaming_chat()`。

`fire_and_forget`策略的通道走`runs.create()`路径。

其余通道走`runs.wait()`路径。

`runs.wait()`路径的流程是这样的：

- 调用`client.runs.wait()`等待运行完成。
- 线程忙时回复忙提示，并释放去重键。
- 提取回复文本、待澄清标志、产物列表。
- 准备产物投递。
- 构造`OutboundMessage`发布回总线。

`fire_and_forget`路径的流程是这样的：

- 调用`client.runs.create()`。
- 这是个短POST，运行进入pending就返回。
- 避免SDK默认300秒的`httpx.ReadTimeout`。
- GitHub的编码运行经常跑好几分钟。
- `ConflictError`仍然同步抛出。
- 忙线程路径保留。
- 成功创建后，如果策略开了跟进缓冲，就孵化观察者。
- 管理器不等最终状态，也不发布回复。
- Agent自己在沙箱里用`gh`命令发帖。

#### 10、流式聊天处理

`_handle_streaming_chat()`处理支持流式的通道。

请求的流模式是`messages-tuple`和`values`。

流处理的核心是`_accumulate_stream_text()`。

这里的安全规则是白名单，不是黑名单。

只有assistant类型的消息才变成可显示文本。

合法的type是`ai`、`AIMessageChunk`、`assistant`。

旧规则只拒绝type里含"tool"的载荷。

结果其他所有载荷都发布了。

DeerFlow的隐藏模型上下文泄漏到了每个流式IM通道。

`DynamicContextMiddleware`把召回的记忆注入为隐藏的`HumanMessage`。

`DurableContextMiddleware`注入隐藏的持久上下文消息。

LangGraph把这些状态写扇出到`messages-tuple`流。

在Buzz中继上实测泄漏过记忆块和用户消息的逐字回显。

匹配用前缀匹配，不用子串匹配。

因为普通单词里含有"ai"，比如chain和domain。

消息类型由`_stream_payload_type()`解析。

解析要兼容两种形状。

一种是DeerFlow自己的gateway发出的`model_dump()`形状。

一种是LangChain的`to_json()`构造器形状。

构造器形状的顶层type是字面量"constructor"。

类名在`id`路径的尾部。

裸字符串载荷完全不接受。

裸字符串不带类型信息，无法归属到assistant。

DeerFlow自己也不产生裸字符串。

发布节流用或逻辑。

距上次发布超过1秒就发布。

或者累计了60个新字符就立即发布。

发布时文本加一个光标符号。

values快照里的澄清文本也会发布。

澄清文本只在values快照里，用户要看到问题。

流结束后在finally里发布最终回复。

流出错了也发布。

错误时用错误文案代替回复文本。

发布完最终回复才释放去重键。

先发布再释放，提供商的重投递才不会抢先于本次的终态回复。

#### 11、命令处理

`_handle_command()`处理斜杠命令。

命令也是运行创建的入口。

所以命令也做绑定身份检查。

支持的命令有：

- `/bootstrap`——启动引导会话，转入聊天处理，带`is_bootstrap`上下文。
- `/new`——创建新对话线程。
- `/status`——显示当前线程ID。
- `/models`——从Gateway拉取模型列表。
- `/memory`——从Gateway拉取记忆状态。
- `/agent`——列表或选择Agent。
- `/goal`——设置、查看或清除目标。
- `/help`——显示帮助。
- 其他斜杠输入——按技能引用解析。

`/agent list`只读生效所有者的自定义Agent。

列表最多50项，描述最多120字符。

`/agent use <name>`在同一个所有者桶里验证。

验证通过就创建新线程。

选择持久化在线程元数据的`channel_agent_name`键里。

自定义Agent还会写规范的`metadata.agent_name`键。

Web的线程搜索结果用这个键路由到Agent专属聊天页。

`lead_agent`故意不写规范键。

`lead_agent`留在普通聊天路由。

`_handle_agent_command()`实现这两个子命令。

`_handle_goal_command()`实现目标命令。

设置目标先通过Gateway的HTTP接口持久化。

持久化成功后把目标文本作为一轮聊天消息路由。

清除和查看都走Gateway的goal接口。

#### 12、跟进缓冲

跟进缓冲解决线程忙时消息被静默丢弃的问题。

GitHub通道的出站只写日志。

线程忙时的标准忙回复对评论者不可见。

评论者以为自己的评论被无视了。

机制是这样的：

- 策略`buffer_followups_on_busy`开启时（GitHub默认开）。
- `runs.create()`遇到`ConflictError`。
- 触发消息进入按线程的内存缓冲。
- 缓冲按GitHub投递ID去重。
- 每线程上限20条。
- 超限丢最旧的，打WARNING日志。
- 丢最旧而不是最新，因为最近的活跃对合并回合更有价值。

排水机制是这样的：

- 第一次成功的`runs.create()`记录run_id。
- 孵化后台观察者订阅该运行的StreamBridge流。
- 观察者看到`END_SENTINEL`就排水。
- 排水把最多10条缓冲合并成一个`<followups-while-busy>`包裹的输入。
- 再发起一次跟进的`runs.create()`。
- 跟进运行同样被观察。
- 积压超过一批就链式排空，不会长出无限大的输入。

排水的`runs.create()`自己也可能撞上忙。

比如一次手动Web回合或定时任务抢占了同一个线程。

这时批次重新入队，不丢失。

这个管理器下次在该线程成功创建并观察运行时，观察者会再尝试排水。

观察者的获取链是这样的：

`app.py`的lifespan把StreamBridge访问器传给`start_channel_service()`。

再传给`ChannelService`。

再传给`ChannelManager`。

没有接入访问器的管理器也能安全缓冲，只是没有观察者自动排水。

已知的有意限制是缓冲和观察者都是进程内状态。

多worker或多副本部署下，跟进评论路由到别的进程就看不到缓冲。

这个限制和issue #4120的跨副本缺口同形，刻意推迟处理。

#### 13、内部辅助类

`_SerializedThreadRunState`保存串行化的锁和等待者计数。

飞书等通道策略开了`serialize_thread_runs`。

同线程的快速跟进而排队，而不是触发运行时的通用忙回复。

等待者归零且锁未持有时，状态从表里移除。

`_FollowupEntry`是一条缓冲的跟进消息。

带去重键和文本。

`_BoundIdentityRejection`是绑定身份拒绝的结果。

字段故意限定为服务端重读的值。

`InvalidChannelSessionConfigError`表示会话配置无效。

`SlashSkillCommandResolutionError`表示技能命令解析失败。

### （二）模块级函数

模块里有一批辅助函数。

- `_slim_metadata()`——去掉已知的超大键。
- `register_inbound_file_reader()`——注册通道的入站文件读取器。
- `_is_allowed_wecom_media_url()`——校验WeCom媒体URL的宿主白名单。
- `_extract_response_text()`——从运行结果提取回复文本。
- `_has_current_turn_clarification()`——判断当前轮是否有待澄清问题。
- `_accumulate_stream_text()`——按白名单累计流式文本。
- `_resolve_slash_skill_command()`——解析斜杠技能引用。
- `_resolve_attachments()`——从所有者桶解析产物。
- `_prepare_artifact_delivery()`——准备产物投递。
- `_ingest_inbound_files()`——把入站文件摄取到上传目录。
- `_channel_storage_user_id()`——解析文件存储用的所有者ID。
- `_owner_headers()`——构造所有者认证头。
- `_effective_owner_user_id()`——取生效所有者。

WeCom媒体URL的校验规则是两族宿主。

一族是qq.com后缀。

另一族是腾讯COS的签名链接形状。

链接形状是`ww-aibot-img-<APPID>.cos.<region>.myqcloud.com`。

数字后缀是所有者的腾讯云APPID。

桶名是用户自己选的。

任何腾讯云账户都能注册一个长得一样的桶。

所以形状本身不能证明所有权。

默认只信任腾讯公开的aibot回调示例里的APPID。

其他账户的媒体走运维配置的后缀列表。

基于URL的入站附件有50MB的上限。

字节在持久化前先缓存在内存里。

超大附件必须在读完之前拒绝，不能读完之后。

日志规则是URL型入站媒体的日志不能含URL的任何部分。

签名链接的路径和查询里带凭证。

失败标签只用附件文件名或宿主。

读取失败记录脱敏的异常摘要，类名加HTTP状态。

## 三、它和谁协作

### （一）依赖谁

- `message_bus`——入站队列和出站发布都经过总线。
- `store`——对话到线程的映射持久化。
- `dedupe_store`——入站去重存储，默认内存实现。
- `run_policy`——按通道注册的运行策略。
- `commands`——已知通道命令清单。
- `connection_identity`——浏览器连接的身份附加。
- Gateway的CSRF中间件——构造内部认证头和CSRF对。
- `langgraph_sdk`——通过HTTP和Gateway的LangGraph兼容API通信。
- `deerflow.runtime`——StreamBridge、END_SENTINEL、键锁表、用户上下文。
- `deerflow.skills`——技能存储和斜杠技能解析。
- `deerflow.config`——自定义Agent配置和路径工具。
- `deerflow.uploads`——上传沙箱许可。

SDK客户端注入进程内的内部认证加匹配的CSRF cookie和头。

这样Gateway接受通道worker发起的状态变更请求，不依赖浏览器会话cookie。

### （二）被谁调用

- `service.py`的`ChannelService`在启动时构造并持有本模块。
- `app.py`的lifespan通过`start_channel_service()`接入StreamBridge访问器。
- 各通道适配器把消息发布到总线，本模块消费。

本模块是整个IM通道系统的枢纽。

所有通道的消息都汇聚到这里。

所有Agent的调用都从这里发出。

## 四、重要性评级

评级是10分。

理由是这样的。

这个模块是IM通道系统的核心调度器。

没有这个模块，任何外部消息都到不了Agent。

任何Agent回复也回不到IM平台。

系统里最关键的安全边界在这里。

绑定身份检查在这里。

webhook触发运行的工具降权在这里。

流式文本的助手白名单在这里。

这些机制直接决定不受信的外部提示能触达什么。

系统的正确性难点也最集中在这里。

入站去重的键设计。

同线程串行化。

跟进缓冲与排水。

确定性线程ID的冲突恢复。

关闭时的排水与取消顺序。

每一个都是实际踩过坑后修出来的逻辑。

这个文件的注释密度和防御深度是全仓库最高的。

它的质量直接决定整个IM集成的质量。
