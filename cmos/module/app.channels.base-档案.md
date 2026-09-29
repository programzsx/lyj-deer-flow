# app.channels.base-档案

## 一、这个模块是干什么的

这个文件是所有IM渠道的抽象基类。

IM渠道指飞书、Slack、Telegram、Discord、钉钉这些外部聊天平台。

每个渠道都要接入一个外部平台。

这个基类定义了渠道必须遵守的统一接口。

接口是start、stop、send三个方法。

基类还提供了很多公共能力。

公共能力包括重试发送、线程安全提交、入站消息发布、绑定码识别。

子类只需要实现平台特有的逻辑。

子类不需要重复写这些公共逻辑。

## 二、模块里的主要成员

### 1、Channel类

Channel是抽象基类，继承自ABC。

Channel是全部渠道实现的父类。

每个渠道连接一个外部平台。

渠道做两件事。

第一件事是接收消息。

接收到的消息被包装成InboundMessage。

消息再发布到MessageBus上。

第二件事是订阅出站消息。

出站消息被发送回外部平台。

子类必须实现start、stop、send三个方法。

#### （1）__init__方法

__init__保存渠道名字。

__init__保存MessageBus引用。

__init__保存配置字典。

配置里的connection_repo是用户绑定连接的仓库。

__init__还初始化线程安全提交相关的锁和集合。

#### （2）start、stop、send抽象方法

start让渠道开始监听外部平台的消息。

stop让渠道优雅停止。

send把回复消息发回外部平台。

send用msg.chat_id和msg.thread_ts定位回复的目标会话。

#### （3）send_file方法

send_file上传一个文件附件到平台。

上传成功返回True。

上传失败返回False。

默认实现直接返回False。

默认实现表示不支持文件上传。

支持文件上传的子类可以覆盖这个方法。

#### （4）_send_with_retry方法

_send_with_retry带重试地执行发送操作。

发送失败后按指数退避等待。

退避延迟是2的幂，比如1秒、2秒、4秒。

重试次数用max_retries控制。

全部重试失败后记录错误日志。

全部重试失败后抛出最后一次的异常。

#### （5）线程安全提交方法族

这组方法解决一个跨线程问题。

渠道SDK的回调经常跑在独立线程上。

回调需要把协程提交到Gateway的事件循环。

_ThreaadsafeSubmission是内部数据类。

_ThreaadsafeSubmission记录协程、目标loop、msg_id、reservation、completion Future。

_submit_threadsafe_coroutine把协程提交到目标loop。

提交时保留真实的asyncio Task。

_submit_threadsafe_coroutine在intake关闭或loop不在运行时关闭协程并释放预留。

_start_threadsafe_submission在目标loop上创建Task。

_start_threadsafe_submission处理提交前就被取消的情况。

_finalize_threadsafe_submission在任务结束时清理记录。

_finalize_threadsafe_submission释放预留并回传结果或异常。

_close_and_drain_threadsafe_futures在stop时关闭intake。

_close_and_drain_threadsafe_futures取消所有未完成任务并等待它们结束。

_open_threadsafe_future_intake允许新启动的渠道提交工作。

还有跨线程工作在运行时不允许重启。

stop必须先调用_close_and_drain_threadsafe_futures。

stop然后再销毁SDK资源。

#### （6）_pending_connect_code方法

_pending_connect_code判断文本是不是"/connect 绑定码"命令。

是命令就返回绑定码。

不是命令或没配置连接仓库就返回None。

各适配器必须在allowed_users校验之前先查这个方法。

原因是浏览器发起的绑定需要引导一个平台从未见过的外部身份。

这个身份还没被授权，先查allowed_users会把它挡掉。

Telegram用的是深链/start <token>流程，不走这个方法。

#### （7）_make_inbound方法

_make_inbound是创建InboundMessage的便捷工厂。

工厂自动带上渠道名。

#### （8）_reserve_inbound方法

_reserve_inbound向MessageBus预留入站容量。

队列满了就明确丢弃消息。

MessageBus会发出限速的警告，警告带累计拒绝数。

这类实时socket或轮询渠道没有可靠的投递重试契约。

所以放不进去的消息只能丢弃。

#### （9）_commit_reserved_inbound方法

_commit_reserved_inbound在MessageBus的loop上提交预留。

提交失败时释放预留。

#### （10）_publish_inbound_or_drop方法

_publish_inbound_or_drop从已序列化的渠道loop发布消息。

发布不等特。

队列满或已关闭就丢弃。

#### （11）_on_outbound方法

_on_outbound是注册到总线上的出站回调。

回调只转发目标是本渠道的消息。

回调先发文本消息。

文本发完再上传文件附件。

文本发送失败就完全跳过文件上传。

跳过是为了避免出现只有文件没有文本的残缺投递。

#### （12）receive_file方法

receive_file处理入站文件附件。

默认实现不做任何事，原样返回消息。

飞书、钉钉等子类会覆盖这个方法。

子类下载文件并保存到沙箱。

子类更新msg.text，把沙箱路径写进去。

下游模型就能读到这些文件。

## 三、它和谁协作

它依赖app.channels.commands里的extract_connect_code。

它依赖app.channels.message_bus里的InboundMessage、MessageBus、预留和异常类型。

它被manager.py、service.py和所有平台渠道实现调用。

平台渠道包括feishu.py、slack.py、telegram.py、discord.py、dingtalk.py、wechat.py、wecom.py、buzz.py、github.py。

这些平台渠道全部继承Channel。

## 四、重要性评级

评级是9分。

理由是这个文件是整个IM渠道体系的根。

所有渠道的统一契约定义在这里。

跨线程提交、重试、容量预留这些安全关键的公共逻辑都集中在这里。

删掉它，全部渠道实现都要各自重写公共逻辑。

不评10分的原因是它本身不含业务逻辑，没有它需要的子类和总线它也无法运转。
