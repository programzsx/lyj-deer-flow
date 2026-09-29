# FeishuChannel档案

## 一、这个类是干什么的

FeishuChannel是飞书和Lark平台的渠道实现。

它用lark-oapi的WebSocket客户端连接飞书。

长连接模式。

不需要公网IP。

它的工作内容是这样的。

它在一个专用线程里运行飞书的WebSocket客户端。

客户端收到消息事件后调用_on_message。

渠道解析消息内容。

文本、文件、图片、富文本都支持。

处理connect命令和已知命令。

发布入站消息到总线。

它订阅出站消息，把回复发回飞书。

它的回复方式很特别。

先回复一张"处理中"的交互卡片。

每次出站更新原位修补同一张卡片。

最终回复也是修补同一张卡片。

这是流式回复。

它还处理入站文件。

图片和文件通过消息资源接口下载。

落盘到线程上传目录。

同步到沙箱。

它还做相邻文件消息的合并。

短时间内的多条文件消息合并成一条入站消息。

## 二、类的成员

### （一）字段

1、_thread和_main_loop

SDK运行线程和网关主循环。

SDK在导入时缓存事件循环，必须在新线程里补丁这个引用再启动。

2、_api_client

lark-oapi的API客户端。

3、_running_card_ids和_running_card_tasks

运行中卡片的id追踪和创建任务。

4、_pending_clarifications

待澄清的追踪。

纯文本消息的澄清延续是短期的内存提示。

5、_pending_inbound_batches

待合并的入站批次。

6、_background_tasks

后台任务集合。

保持强引用并暴露错误。

7、_thread_lock

线程锁。

保护澄清和批次状态。

### （二）属性

1、supports_streaming

支持流式回复。

2、is_running

运行意味着SDK线程还活着。

### （三）生命周期方法

1、start()

启动渠道。

导入SDK类。构建API客户端。订阅出站回调。在新线程里补丁SDK的事件循环引用并启动WS客户端。

2、stop()

停止渠道。

取消订阅。清理跨线程提交。取消后台任务和卡片任务。等待SDK线程。

### （四）入站方法

1、_on_message()

处理一条飞书消息。

它在lark线程上运行。解析消息内容。文本、文件、图片、富文本都支持。富文本保留段落边界。处理connect命令。识别命令类型。解析topic_id。合并相邻文件消息。调度入站准备。

2、_resolve_topic_id()

解析消息的主题id。

先查存储的映射。P2P聊天没有存储映射时topic为None，所有消息共享一个线程。

3、_queue_file_inbound_batch()和_flush_pending_inbound_batch_after()

合并相邻的文件消息。

0.75秒窗口内的文件消息合并成一条入站消息。

### （五）文件方法

1、receive_file()

下载飞书文件。

按image_key或file_key下载。落盘。同步沙箱。虚拟路径替换消息文本里的占位符。

2、_receive_single_file()

下载单个文件。

大小上限20MB。规范化文件名。唯一命名。防符号链接写入。授权沙箱读取。失败生成"获取失败"标记。

3、_upload_image()和_upload_file()

上传出站图片和文件。

文件类型按后缀映射。

### （六）卡片与回复方法

1、send()

发送回复。

带重试地调用_send_card_message。

2、_send_card_message()

发送或更新当前请求的卡片。

运行中卡片存在就修补它。不存在就等创建任务或新建。最终回复后添加DONE表情。

3、_reply_card()、_create_card()、_update_card()、_build_card_content()

卡片回复、创建、修补、内容构建。

4、_ensure_running_card()、_create_running_card()、_ensure_running_card_started()

运行中卡片的确保存在和创建。

5、_add_reaction()

添加表情反应。

### （七）其他方法

1、_prepare_inbound()

入站准备工作。

附加连接身份。添加OK表情。启动运行卡片。提交预留的消息。

2、_remember_thread_mapping()

记住线程映射。

把多个主题id都映射到同一线程。

3、_remember_pending_clarification()和_consume_pending_clarification()

待澄清的记录和消费。

4、_attach_connection_identity()和_bind_connection_from_connect_code()

连接身份解析和绑定处理。

## 三、它和谁协作

FeishuChannel是渠道体系的一个平台实现。

它继承Channel基类。复用基类的生命周期、重试、跨线程提交、入站预留设施。

它依赖lark-oapi SDK。WebSocket客户端、消息API、文件API都通过它。

它依赖MessageBus。通过基类设施收发消息。

它被ChannelService实例化和管理。is_running报告SDK线程存活性。

它把InboundMessage发给ChannelManager消费。

它和sandbox_files协作同步文件到非本地沙箱。

## 四、重要性评级

评级：7分。

理由如下。

它是飞书平台的完整渠道实现。

它的卡片原位修补是流式回复的精细实现。

它的文件消息合并、占位符替换、失败标记处理了真实的用户体验问题。

它的文件下载和沙箱同步链路完整。

它只在配置了飞书的部署里生效。所以不到8分。
