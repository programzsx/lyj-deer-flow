# WechatChannel档案

## 一、这个类是干什么的

WechatChannel是微信平台的渠道实现。

它连接微信的iLink机器人API。

长轮询方式。

它的工作内容是这样的。

它在网关主循环上运行轮询任务。

不断调用iLink的getupdates接口。

收到消息后解析文本和附件。

处理connect命令和白名单。

发布入站消息到总线。

它订阅出站消息，把回复发回微信。

它还处理附件。

入站图片和文件从平台CDN下载。

下载的URL必须过域名白名单。

下载的字节用AES-128-ECB解密。

出站图片和文件加密后上传到CDN。

再发送消息引用上传的媒体。

它还支持二维码登录。

没有bot_token时可以扫码引导。

令牌和轮询游标持久化到本地状态文件。

## 二、类的成员

### （一）字段

1、_main_loop和_poll_task和_client

网关主循环、轮询任务、HTTP客户端。

2、_base_url和_cdn_base_url

iLink API地址和CDN地址。

3、_bot_token和_ilink_bot_id

机器人令牌和机器人id。

4、_auth_state和_auth_lock

认证状态和认证锁。

5、_get_updates_buf

轮询游标。

6、_context_tokens_by_chat和_context_tokens_by_thread

按聊天和按线程缓存的上下文令牌。

发送消息需要context_token。

7、_state_dir、_cursor_path、_auth_path

状态目录、游标文件路径、认证文件路径。

状态故意不在构造函数里加载。构造发生在异步路径上，文件IO会阻塞事件循环。状态在start()里通过线程加载。

8、大小和类型限制字段

入站图片20MB。入站文件50MB。出站同理。允许的文件扩展名和MIME类型。允许的媒体域名后缀。

### （二）枚举类

它还定义了两个枚举。

MessageItemType是消息条目类型。文本、图片、语音、文件、视频。

UploadMediaType是上传媒体类型。图片、视频、文件、语音。

### （三）生命周期方法

1、start()

启动渠道。

从磁盘加载持久状态。检查令牌。确保HTTP客户端。订阅出站回调。启动轮询任务。

2、stop()

停止渠道。

取消轮询任务。关闭HTTP客户端。

### （四）入站方法

1、_poll_loop()

轮询主循环。

认证检查。调用getupdates。令牌过期时停止轮询并提示重新扫码。每条消息隔离处理，一条失败不影响整批。游标在整批处理完后才推进。

2、_handle_update()

处理一条更新。

提取文本和上下文令牌。先处理connect命令。过白名单。提取附件。构造InboundMessage发布。

3、_extract_inbound_files()和_extract_image_file()和_extract_file_item()

提取入站附件。

URL必须过域名白名单。AES密钥从多个候选位置解析。流式下载带密文大小上限。下载后解密。大小检查。文件落盘到状态目录。

4、_download_cdn_bytes()

流式下载一个媒体。

请求identity编码。拒绝意外的压缩编码。在途超限就中止。

### （五）出站方法

1、send()

发送文本回复。

解析上下文令牌。调用sendmessage接口。

2、send_file()和_send_image_attachment()和_send_file_attachment()

发送附件。

加密上传到CDN。再发消息引用媒体。出站文件类型和大小有白名单和上限。

### （六）认证与状态方法

1、_ensure_authenticated()

确保已认证。

令牌存在直接返回。否则尝试二维码登录。

2、_bind_via_qrcode()和request_login_qrcode()和request_login_status()

二维码登录流程。

请求二维码。轮询状态。确认后保存令牌。

3、_load_state()、_save_state()、_load_auth_state()、_save_auth_state()

游标和认证状态的持久化。

认证文件用0600权限原子写盘，令牌不暴露在默认权限下。

### （七）其他方法

1、_attach_connection_identity()和_bind_connection_from_connect_code()和_send_connection_reply()

连接身份解析、绑定处理、绑定回复。

2、_is_allowed_media_url()

媒体URL域名白名单。

点边界感知。notqq.com不会匹配qq.com后缀。

3、_resolve_context_token()

解析发送消息需要的上下文令牌。

4、_check_user()

白名单检查。

## 三、它和谁协作

WechatChannel是渠道体系的一个平台实现。

它继承Channel基类。复用基类的生命周期、重试、白名单辅助、connect命令识别设施。

它依赖微信iLink的HTTP API。轮询、发消息、上传下载都通过httpx调用。

它依赖cryptography库做AES加密解密。

它依赖MessageBus。通过基类设施收发消息。

它被ChannelService实例化和管理。

它把InboundMessage发给ChannelManager消费。

它被WechatQRLogin使用。二维码登录的HTTP调用复用渠道的方法。

## 四、重要性评级

评级：6分。

理由如下。

它是微信iLink平台的完整渠道实现。

它的媒体处理链路复杂。域名白名单、AES加解密、密文流上限、明文上限的双重检查。

它的状态持久化保护了令牌安全。

它的轮询游标推进规则防止了消息跳过。

它只在配置了微信的部署里生效。所以只有6分。
