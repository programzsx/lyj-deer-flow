# DiscordChannel档案

## 一、这个类是干什么的

DiscordChannel是Discord平台的渠道实现。

它用discord.py库连接Discord。

它的工作内容是这样的。

它在一个专用线程里运行Discord客户端。

客户端收到消息后调用_on_message。

渠道过滤机器人消息和白名单服务器。

识别是否提及机器人。

按线程模式决定路由到已有线程还是新建线程。

发布入站消息到总线。

它订阅出站消息，把回复发回Discord。

回复支持文本和文件。

它还管理输入状态指示器和确认表情反应。

它的一个特殊职责是线程管理。

频道对话可以自动归组到一个Discord线程。

频道到线程的映射持久化到JSON文件。

## 二、类的成员

### （一）字段

1、_bot_token

Discord机器人令牌。

2、_allowed_guilds

允许的服务器id白名单。

3、_mention_only

是否只在被提及时响应。

4、_thread_mode

是否把频道对话归组到线程。

默认和mention_only一致。

5、_allowed_channels

总是接受消息的频道id集合。

6、_active_threads和_active_thread_ids

频道到Discord线程的映射和反向查找集合。

7、_thread_store_lock和_thread_store_loaded

线程存储锁和加载标志。

加载标志防止启动失败时用空映射覆盖持久化文件。

8、_thread_store_path

线程映射的JSON文件路径。

9、_typing_tasks

输入状态指示器任务。

10、_ack_reaction_tasks

确认表情反应任务。

保持强引用，防止被垃圾回收。

11、_client、_thread、_discord_loop、_main_loop

Discord客户端、客户端线程、Discord循环、网关主循环。

### （二）属性

1、is_running

运行意味着客户端线程还活着。

客户端线程因令牌失效等原因退出时，_running可能还是True。这个属性让ChannelService能感知客户端死亡并重启渠道。

### （三）生命周期方法

1、start()

启动渠道。

配置意图。注册on_message事件。订阅出站回调。启动客户端线程。加载持久化的线程映射。

2、stop()

停止渠道。

冲刷线程映射。按边界情况清理输入指示器和确认反应任务。关闭客户端。等待客户端线程。

### （四）线程映射方法

1、_load_active_threads()

启动时从JSON文件恢复线程映射。

2、_record_thread_mapping()

同步更新内存映射。

在事件循环上运行，让新线程的消息立即被识别。

3、_persist_thread_mappings()

把映射冲刷到磁盘。

### （五）入站方法

1、_on_message()

处理一条Discord消息。

过滤机器人和白名单。识别提及。处理connect命令。预留入站容量。交给_handle_admitted_message。

2、_handle_admitted_message()

完成已接收消息的路由。

区分线程内消息和频道消息。线程内已知线程正常处理。孤儿线程新建线程。频道消息按mention_only和thread_mode决定新建线程还是直接回复。发布入站消息。启动输入指示器。安排确认反应。

3、_create_thread()

创建Discord线程。

只有文本频道和新闻频道支持线程。

### （六）出站方法

1、send()

发送回复。

先停输入指示器。解析目标频道或线程。长文本按换行边界分块。

2、send_file()

上传文件附件。

从磁盘读取字节。交给discord.py上传。上传有单独的更大超时。

3、_resolve_target()和_get_channel_or_thread()和_fetch_channel()

解析出站目标。

4、_run_on_discord_loop()

把协程调度到Discord循环并有限等待。

普通发送30秒超时。上传120秒超时。循环不存在或没运行时快速失败，避免挂死调度器工作协程。

### （七）任务管理方法

1、_start_typing()、_stop_typing()、_cancel_typing_tasks()、_discard_typing_tasks()

输入状态指示器的启动、停止、取消、丢弃。

2、_add_reaction()、_schedule_ack_reaction()、_cancel_ack_reaction_tasks()、_discard_ack_reaction_tasks()

确认表情反应的执行、安排、取消、丢弃。

## 三、它和谁协作

DiscordChannel是渠道体系的一个平台实现。

它继承Channel基类。复用基类的生命周期、重试、跨线程提交、入站预留设施。

它依赖discord.py库。客户端、线程创建、消息发送都通过它。

它依赖MessageBus。通过基类设施收发消息。

它被ChannelService实例化和管理。is_running报告客户端线程存活性，支持自动重启。

它把InboundMessage发给ChannelManager消费。

## 四、重要性评级

评级：6分。

理由如下。

它是Discord平台的完整渠道实现。

它的线程归组功能把频道对话组织成独立线程。

它的跨循环调用全部有超时上界，避免死客户端挂死调度器。

它的线程映射持久化和加载标志防止了数据丢失。

它只在配置了Discord的部署里生效。逻辑模式和其他渠道高度相似。所以只有6分。
