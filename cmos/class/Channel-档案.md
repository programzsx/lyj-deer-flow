# Channel档案

## 一、这个类是干什么的

Channel是所有IM渠道实现的抽象基类。

每个渠道连接一个外部消息平台。

渠道的职责有两块。

第一块是接收。渠道收到外部平台的消息后，包装成InboundMessage，发布到MessageBus。

第二块是发送。渠道订阅总线的出站消息，把智能体的回复发回外部平台。

子类必须实现start、stop、send三个抽象方法。

基类还提供了一组公共设施。跨线程提交设施帮助SDK回调线程安全地把工作交给网关事件循环。重试设施给出站发送提供统一的指数退避重试。入站预留设施帮助渠道在总线容量不足时明确丢弃消息。文件接收设施留给子类覆盖。

## 二、类的成员

### （一）字段

1、name

渠道名。

例如feishu、slack。它也是总线出站路由的匹配键。

2、bus

MessageBus实例。

3、config

渠道配置字典。

来自config.yaml的channels条目。

4、_running

运行状态标志。

5、_connection_repo

连接仓库。

从config里取出，用于用户绑定流程。

6、_threadsafe_submissions和_threadsafe_submissions_lock

跨线程提交的追踪集合和锁。

提交和关闭共享这把锁，保证stop()不会漏掉并发创建的future。

7、_threadsafe_submission_intake_open

提交入口是否开放。

关闭后新的跨线程提交会被拒绝。

### （二）属性

1、is_running

是否正在运行。

2、supports_streaming

是否支持流式回复。

基类默认False。子类可以覆盖。

### （三）抽象方法

1、start()

启动渠道监听。

子类实现它，建立与外部平台的连接。

2、stop()

优雅停止渠道。

子类实现它，断开连接并清理资源。

3、send(msg)

把一条出站消息发回外部平台。

实现应该用msg.chat_id和msg.thread_ts把回复路由到正确的会话或线程。

### （四）可覆盖的普通方法

1、send_file(msg, attachment)

上传单个文件附件。

默认实现返回False，表示不支持文件上传。子类按平台能力覆盖。

2、receive_file(msg, thread_id, user_id)

处理入站文件附件。

默认什么都不做，原样返回消息。子类可以覆盖它下载文件、保存到沙箱、把沙箱路径写进消息文本。

### （五）跨线程提交方法

1、_submit_threadsafe_coroutine()

从SDK回调线程提交协程。

它在属主事件循环上创建并保留真正的asyncio.Task。返回True表示提交成功。

2、_start_threadsafe_submission()

在事件循环上创建任务。

它处理预启动取消和启动失败两种边界情况。

3、_finalize_threadsafe_submission()

任务结束时收尾。

它把结果或异常转写到completion future，并释放入站预留。

4、_close_and_drain_threadsafe_futures()

关闭提交入口并清理在途任务。

stop()必须调用它，再拆除SDK资源。

5、_open_threadsafe_future_intake()

开放提交入口。

还有在途的跨线程工作时，禁止重启。

### （六）辅助方法

1、_send_with_retry()

带重试的出站发送。

按指数退避重试，重试耗尽后抛出最后的异常。

2、_log_future_error()

记录future的异常。

3、_pending_connect_code()

识别/connect绑定命令。

适配器必须在allowed_users检查之前调用它，让浏览器发起的绑定能引导一个平台机器人还没见过的身份。

4、_make_inbound()

InboundMessage的便捷工厂。

5、_reserve_inbound()

预留入站容量。

队列满时返回None，表示明确丢弃。

6、_commit_reserved_inbound()

提交预留的消息。

失败时释放预留。

7、_publish_inbound_or_drop()

在已串行化的提供者循环里发布消息，不等待。

8、_on_outbound()

出站回调。

只转发目标是自己这个渠道的消息。先发文本，再传文件。文本发送失败时跳过文件，避免残缺投递。

## 三、它和谁协作

Channel是渠道体系的抽象层。

它依赖MessageBus。所有渠道通过它发布入站消息、接收出站消息。

它被全部九个渠道子类继承。

子类包括BuzzChannel、DingTalkChannel、DiscordChannel、FeishuChannel、GitHubChannel、SlackChannel、TelegramChannel、WechatChannel、WeComChannel。

它定义的InboundMessage和OutboundMessage被ChannelManager消费。

ChannelService负责实例化子类并调用start和stop。

它的跨线程提交设施被所有依赖SDK回调线程的子类使用。

## 四、重要性评级

评级：9分。

理由如下。

它是九个渠道的共同骨架。

没有它，每个渠道都要重复实现生命周期、重试、跨线程提交、入站预留这些设施。

它的抽象方法契约定义了新增一个渠道需要做什么。

它的跨线程提交设施解决的是SDK回调线程和网关事件循环之间的真实并发问题。

它唯一不如核心调度器重要的地方，是它本身不做调度决策。具体的消息流转都在子类和ChannelManager里。
