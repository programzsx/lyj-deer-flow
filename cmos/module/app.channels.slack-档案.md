# app.channels.slack 档案

## 一、这个模块是干什么的

这个文件是Slack通道适配器。

DeerFlow要让Agent能通过Slack对话。

这个文件就是DeerFlow和Slack之间的桥。

它用Socket Mode连接Slack。

Socket Mode是WebSocket连接。

用Socket Mode不需要公网IP。

不需要OAuth回调URL。

配置里要有两个令牌。

一个是`bot_token`，Slack Bot User OAuth Token，格式是xoxb开头。

一个是`app_token`，Slack App-Level Token，格式是xapp开头，Socket Mode专用。

这个模块的职责是双向的。

入站方向是接收Slack的消息。

消息转换成统一格式后发到总线。

出站方向是把总线的回复发回Slack。

回复还会带表情回应。

收到消息加eyes表情。

回复完成加对勾表情。

回复失败加叉号表情。

## 二、模块里的主要成员

### （一）模块级辅助函数

#### 1、_escape_slack_text()

`_escape_slack_text()`转义Slack的保留字符。

Slack要求发送方把`&`、`<`、`>`替换成HTML实体。

替换成`&amp;`、`&lt;`、`&gt;`。

不转义的`<...>`会触发Slack自己的提及和链接语法。

比如`<@USERID>`会变成用户提及。

比如`<http://url|label>`会变成链接。

这里有个顺序讲究。

转义必须在markdown转换器之前跑，不能在之后。

转换器会为真正的markdown链接生成自己的mrkdwn链接语法。

生成的语法必须原样到达Slack。

先转义原始输入，转换器的输出不动，两个要求都满足。

`html.escape(..., quote=False)`先替换`&`再替换`<`和`>`。

它引入的实体不会被二次转义。

还有一个细节。

`>`只在行首对Slack特殊。

行首的`>`是Slack自己的引用块标记。

转义每一个`>`会把引用行变成可见的`&gt;`文本。

所以行首的`>`在转义后恢复成字面量`>`。

其他位置的`>`照常转义。

#### 2、_normalize_allowed_users()

`_normalize_allowed_users()`规范化用户白名单。

白名单可以是列表。

白名单可以是单个字符串。

其他标量类型当作单元素字符串处理，并打警告。

空白名单表示允许所有人。

#### 3、_strip_leading_slack_bot_mention()

`_strip_leading_slack_bot_mention()`剥掉消息开头的机器人提及。

`app_mention`事件的消息文本以`<@机器人ID>`开头。

这个函数把提及剥掉，只留正文。

提及里可以带`|`别名或`!`前缀，都会处理。

提及的不是本机器人就不动文本。

### （二）SlackChannel类

`SlackChannel`是本模块的主类。

继承自`base.Channel`抽象基类。

#### 1、构造方法

`__init__()`初始化这些状态。

Socket Mode客户端和网络客户端都是懒创建。

事件循环引用记下来。

SDK线程的回调要用它调度到主循环。

用户白名单规范化保存。

网络客户端工厂可注入，默认用`WebClient`。

每个用户连接可以有专属的网络客户端。

机器人用户ID可从配置直接给。

没给就在运行时解析。

#### 2、start()启动方法

`start()`的流程是这样的。

已经在运行就直接返回。

先导入slack_sdk的依赖。

导入失败打错误日志并返回。

配置了`event_delivery == "http"`时报错。

HTTP Events模式这个适配器不支持。

要用Socket Mode加app_token。

缺令牌时报错并返回。

然后初始化运维机器人的网络客户端。

创建Socket Mode客户端。

注册Socket Mode事件监听器。

打开线程安全提交通道。

标记运行中。

订阅出站总线。

最后在后台线程里启动Socket Mode。

后台连接走`_connect_socket_mode()`。

`run_in_executor`返回的future没人等待。

异常存在future上永远不会浮出来。

所以连接失败要在包装函数里记日志。

连接失败意味着通道收不到事件。

这是个容易忽略的坑。

#### 3、stop()停止方法

`stop()`的流程是这样的。

先标记不在运行。

退订出站总线。

关闭并排空线程安全的提交通道。

然后关闭Socket Mode客户端。

#### 4、send()发送方法

`send()`把回复发回Slack。

流程是这样的。

先为这条消息选网络客户端。

消息文本先转义再转mrkdwn。

线程消息带`thread_ts`。

发送用`_send_with_retry()`，最多重试3次。

发送成功且是线程消息时，给线程根加对勾表情。

发送失败时给线程根加叉号表情。

#### 5、send_file()文件发送方法

`send_file()`上传文件到Slack。

用`files_upload_v2`接口。

带上文件路径、文件名、标题。

线程消息带`thread_ts`。

失败记日志并返回假。

#### 6、网络客户端选择

`_get_web_client_for_message()`为消息选择网络客户端。

有用户连接时优先用连接的专属令牌。

从连接仓库取`access_token`。

取不到就用运维机器人的客户端。

取到了就按连接缓存客户端。

每个连接复用一个客户端。

`WebClient`维护自己的HTTP会话和限速状态。

令牌变了才重建客户端。

这个设计让同一个连接的消息共用限速预算。

#### 7、入站事件处理

`_on_socket_event()`是slack_sdk对每个Socket Mode事件的回调。

这个方法跑在SDK的线程里，不是主循环。

流程是这样的。

先确认事件。

发回`envelope_id`确认。

不是`events_api`类型就忽略。

机器人用户ID还没解析时从授权头解析。

`authorizations`里第一个条目的`user_id`就是。

只处理`message`和`app_mention`两种事件。

交给`_handle_message_event()`。

#### 8、消息事件处理

`_handle_message_event()`处理单条消息事件。

流程是这样的。

机器人自己的消息和带subtype的消息忽略。

取用户ID和文本。

`app_mention`的消息剥掉开头的机器人提及。

空文本忽略。

检查连接码。

消息是`/connect <code>`就先处理绑定。

绑定处理在白名单检查之前。

这样是刻意的。

新加入白名单但还没绑定的用户可以借此完成首次绑定。

白名单检查在绑定码处理之后。

不在白名单的普通消息直接忽略。

然后构造入站消息。

已知命令标记为COMMAND类型。

其他标记为CHAT类型。

Slack的话题ID就是`thread_ts`。

线程消息的`thread_ts`是根消息的时间戳。

所有线程消息共享一个话题。

非线程消息的`thread_ts`是自己的时间戳。

自己是一个新话题。

元数据里带`team_id`和消息ID。

`team_id`是去重键需要的工作区标识。

然后发布到总线。

发布前先预留入站名额。

预留拿不到就直接返回。

预留成功后加eyes表情。

再发一条"正在处理"回复。

发送是即发即忘的，跑在SDK线程。

最后把消息提交到主循环。

主循环提交分两条路。

没有连接仓库时用`call_soon_threadsafe`直接提交。

有连接仓库时用`_submit_threadsafe_coroutine()`提交完整协程。

协程里先附加连接身份再提交。

无论哪条路失败，预留都要释放。

主循环停了就记日志并释放。

#### 9、连接身份附加

`_publish_inbound_with_connection()`给消息附加连接身份。

工作区ID来自team_id。

调用共享的`attach_connection_identity()`。

连接身份让消息带上`connection_id`和`owner_user_id`。

管理器用这些字段做绑定检查和所有者路由。

#### 10、连接绑定

`_bind_connection_from_connect_code()`处理`/connect <code>`绑定。

流程是这样的。

消费OAuth状态。

状态不存在或过期就回复错误。

取发送者的用户ID和工作区ID。

缺任何一项就回复失败。

然后写入连接记录。

所有者来自OAuth状态。

平台账户ID是Slack用户ID。

工作区ID是team_id。

状态标记为connected。

最后回复"已连接"。

绑定成功后，这个用户在这个工作区的消息都会路由到他的DeerFlow账户。

#### 11、线程安全提交

这个类的入站处理跑在SDK线程。

主循环操作必须线程安全。

基类提供了`_submit_threadsafe_coroutine()`。

这个方法在主循环上创建并保留真正的`asyncio.Task`。

SDK线程的回调通过它提交协程。

提交和关闭用基类的原子方法。

`stop()`必须先排空提交通道再拆SDK资源。

### （三）表现细节

Slack通道有几种表情反馈。

收到消息加eyes表情。

回复完成加对勾表情。

回复失败加叉号表情。

表情都是尽力而为。

重复加表情的错误被静默忽略。

其他加表情失败打警告。

"正在处理"回复用沙漏表情开头。

## 三、它和谁协作

### （一）依赖谁

- `base.Channel`——抽象基类，提供生命周期骨架和线程安全提交。
- `message_bus`——入站发布和出站订阅。
- `commands.is_known_channel_command`——判断消息是不是斜杠命令。
- `connection_identity.attach_connection_identity`——附加浏览器连接身份。
- `slack_sdk`——Socket Mode客户端和网络客户端。
- `markdown_to_mrkdwn`——markdown转mrkdwn的转换器。
- 连接仓库——用户连接的凭证、OAuth状态、连接写入。

### （二）被谁调用

- `service.py`的`ChannelService`懒加载并启动这个通道。
- `manager.ChannelManager`通过总线把出站回复交给这个通道。
- 用户在Slack里直接和机器人对话触发入站。

数据流是这样的。

Slack用户发消息。

Socket Mode把事件推给监听器。

监听器转换成统一的`InboundMessage`发到总线。

`ChannelManager`从总线取出消息调用Agent。

Agent回复作为`OutboundMessage`回到总线。

总线回调`send()`发回Slack。

## 四、重要性评级

评级是6分。

理由是这样的。

这个模块是Slack平台的完整适配器。

没有它，Slack用户完全无法使用DeerFlow。

它的入站处理跑在SDK线程，线程安全细节很关键。

预留、提交、释放的配对错了会漏消息或卡死队列。

它的转义顺序讲究。

先转义再转markdown。

顺序错了会出现假提及、假链接、坏引用块。

它支持用户连接绑定。

浏览器发起的连接让个人账户也能用。

它不含调度逻辑。

调度在`manager.py`。

它不是其他通道的依赖。

每个通道适配器互相独立。

所以评分低于管理器和服务。

但它是一个用户量大的平台的唯一入口。

评级为6分。
