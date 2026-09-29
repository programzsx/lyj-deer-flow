# app.channels.feishu 档案

## 一、这个模块是干什么的

这个模块是DeerFlow的飞书接入通道。

这个模块把飞书（Lark）聊天平台和DeerFlow智能体连接起来。

用户在飞书里发消息。

这个模块接收消息。

这个模块把消息交给DeerFlow处理。

DeerFlow处理后产生回复。

这个模块把回复发回飞书。

这个模块使用WebSocket长连接方式连接飞书。

WebSocket方式不需要公网IP。

这一点对个人部署很重要。

这个模块的交互体验很丰富。

用户发消息后，机器人先给消息加"OK"表情。

机器人再回复一张"Working on it......"卡片。

智能体处理完后，卡片被更新为结果。

最后机器人给原消息加"DONE"表情。

这个模块支持流式输出。

流式输出通过原地更新同一张卡片实现。

这个模块还能收发文件。

## 二、模块里的主要成员

### 1、FeishuChannel类

这个类是模块的核心。

这个类继承自`Channel`基类。

这个类实现了`start`、`stop`、`send`三个生命周期方法。

#### （1）构造函数`__init__`

构造函数接收`bus`和`config`两个参数。

配置包含`app_id`和`app_secret`。

配置包含可选的`verification_token`和`domain`。

构造函数初始化多个状态字典。

`self._running_card_ids`记录每条源消息对应的运行中卡片ID。

`self._running_card_tasks`记录创建卡片的进行中任务。

`self._pending_clarifications`记录待澄清的会话提示。

`self._pending_inbound_batches`记录待合并的入站文件消息。

`self._thread_lock`保护这些字典。

`self._background_tasks`跟踪后台任务。

#### （2）`start`方法和`_run_ws`方法

`start`方法先检查`lark-oapi`库是否安装。

`start`方法检查`app_id`和`app_secret`。

`start`方法构建API客户端。

`start`方法订阅消息总线出站消息。

`start`方法启动专用线程。

线程里运行`_run_ws`。

`_run_ws`要处理一个SDK的坑。

lark-oapi在导入时缓存了模块级事件循环。

uvicorn用uvloop时，缓存的是主线程的uvloop。

主循环已经在跑。

`Client.start()`里的`run_until_complete`会报RuntimeError。

解决办法是给这个线程建一个普通事件循环。

再把SDK的模块级loop引用替换掉。

这样SDK就用这个不运行的循环了。

`is_running`属性在这里被重写。

重写后不仅看`_running`标志。

还看轮询线程是否活着。

这让上层能在SDK线程死后重启通道。

#### （3）`stop`方法

`stop`方法停止通道。

`stop`方法先关闭入站提交口。

`stop`方法取消并等待后台任务和卡片任务。

`stop`方法等待线程退出，超时5秒。

#### （4）`send`方法和`_send_card_message`

`send`方法带重试地发送卡片消息。

核心逻辑在`_send_card_message`。

这个方法处理几种情况。

有源消息ID且有运行中卡片时，patch同一张卡片。

卡片JSON设了`update_multi=true`。

这是飞书patch API的要求。

patch失败时，非最终消息重抛异常。

最终消息降级为新建一条回复卡片。

有源消息ID但没有卡片ID时，最终消息新建回复卡片。

非最终消息不重复创建。

没有源消息ID时，直接在目标会话新建卡片。

每条卡片文本可以带源消息预览。

预览只在群聊且属于话题内消息时带上。

预览压缩到3行、240字符内。

预览用引用格式放在正文前面。

最终消息还会给源消息加"DONE"表情。

#### （5）运行中卡片管理

`_ensure_running_card`确保运行中卡片存在。

`_ensure_running_card_started`保证每条源消息只启动一次创建任务。

`_create_running_card`创建卡片并缓存message_id。

创建可能失败。

失败时后续更新会回退为新建回复。

`_track_background_task`持有fire-and-forget任务的强引用。

这样任务不会被垃圾回收。

任务出错也会被记录。

#### （6）`receive_file`方法和`_receive_single_file`

这个方法下载用户发来的文件。

飞书的image_key和file_key是分开的。

file_key包括文件、视频、音频，不包括表情贴纸。

消息文本里有`[image]`或`[file]`占位符。

下载成功后用`replace_next_placeholder`替换占位符。

替换为沙箱虚拟路径。

这样智能体能按路径读文件。

替换按顺序进行。

`search_from`保证每个占位符只被替换一次。

替换失败的占位符变成"Failed to obtain the [type]"。

同一条消息里后面的附件还能继续加载。

下载前读取最多20000001字节。

超过20000000字节就拒绝。

拒绝发生在持久化之前。

文件写入上传目录。

写入前做几件事。

`file_key`是平台数据。

fallback文件名限制`file_key`为安全字符集。

平台文件名用`normalize_filename`清洗。

写入时用`claim_unique_filename`防覆盖。

用`write_upload_file_no_symlink`拒绝符号链接。

写入加`_thread_lock`锁。

写入后授权沙箱读取权限。

然后同步到非本地沙箱。

同步带`release_on_last=True`参数。

最后一个持有者退出后向飞书请求释放。

失败一律返回失败标记。

#### （7）`_on_message`方法

这个方法是入站消息的入口。

lark-oapi收到消息后回调这里。

回调跑在飞书线程上。

这个方法解析消息内容。

内容类型有四种。

纯文本直接取text。

file_key消息取文件并设文本为`[file]`。

image_key消息取图片并设文本为`[image]`。

富文本消息逐段落解析。

段落里包含text、at、img、file、media等元素。

段落内用空格拼接。

段落间用空行拼接。

然后检查`/connect <code>`绑定命令。

绑定先于其他检查。

然后识别命令。

已知斜杠命令才算命令。

群聊"@bot /goal"的提及符只在命令路径去掉。

普通聊天保留提及符。

然后确定`topic_id`。

单聊`topic_id`为None，所有消息共享一个线程。

但先查存储的映射，兼容升级前的单聊线程。

然后处理待澄清延续。

如果上一条回复是澄清提问。

下一条普通消息会路由回同一个线程。

延续提示存活30分钟。

TTL是`PENDING_CLARIFICATION_TTL_SECONDS`。

文件类入站消息有合并窗口。

窗口是`FEISHU_INBOUND_BATCH_WINDOW_SECONDS`，0.75秒。

用户连发多张图会合并成一条消息。

合并避免每张图触发一次智能体运行。

窗口过期后批量发出去。

最后构造`InboundMessage`并调度到主循环。

#### （8）线程映射记录

`_remember_thread_mapping`把话题ID映射到DeerFlow线程ID。

映射写入`channel_store`。

写入的topic_id包括回复卡片ID和元数据里的各种消息ID。

这样用户点进话题或引用消息，都能路由到正确线程。

#### （9）待澄清机制

`_remember_pending_clarification`记录澄清卡片。

`_consume_pending_clarification`消费澄清记录。

过期记录被丢弃。

`_ensure_pending_thread_mapping`恢复映射。

这些状态是短期的内存提示。

显式回复仍由持久化的消息ID映射覆盖。

### 2、文件上传辅助方法

`_upload_image`上传图片换取image_key。

`_upload_file`上传文件换取file_key。

文件类型按后缀映射。

xls、ppt、pdf、doc各有对应类型。

其他都是stream。

上传都是阻塞调用。

都用`asyncio.to_thread`包装。

### 3、卡片构建方法

`_build_card_content`构建飞书交互卡片JSON。

卡片原生渲染markdown。

包括标题、加粗、代码块、列表、链接。

## 三、它和谁协作

### 1、它依赖谁

它依赖`app.channels.base`的`Channel`基类。

它依赖`app.channels.message_bus`的消息类型。

它依赖`app.channels.commands`的命令识别工具。

它依赖`app.channels.connection_identity`的身份解析。

它依赖`app.channels.sandbox_files`的沙箱文件同步。

它依赖`deerflow.config.paths`的路径工具。

它依赖`deerflow.uploads.manager`的上传写入工具。

它依赖外部库`lark-oapi`。

配置来自config.yaml的`channels.feishu`段。

### 2、谁调用它

`app.channels.service`按配置创建并启动它。

`ChannelManager`通过消息总线投递出站消息。

manager还会调用它的`receive_file`下载入站文件。

浏览器绑定流程的code由`app.gateway.routers.channel_connections`生成。

用户通过`/connect <code>`消息消费code。

## 四、重要性评级

### 1、评级

9分。

### 2、理由

这个模块是飞书平台的完整接入层。

飞书是DeerFlow支持的主要IM平台之一。

它的功能在这批平台通道里最丰富。

它有运行中卡片、源消息预览、待澄清延续、入站批量合并等特性。

这些特性让群聊和话题场景的体验接近原生助手。

它的入站文件下载和沙箱同步链路很完整。

大小限制、文件名清洗、写入锁、符号链接拒绝、权限授权都在。

它处理了lark-oapi的uvloop兼容坑。

这个坑不处理通道根本起不来。

它维护线程映射，保证话题路由正确。

它不是全系统的中枢。

中枢是`manager.py`和`message_bus.py`。

但它比其他平台通道承担了更多交互职责。

所以评9分。

文件约1255行，逻辑密度高。
