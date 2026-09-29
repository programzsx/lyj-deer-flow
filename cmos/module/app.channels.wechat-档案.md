# app.channels.wechat 档案

## 一、这个模块是干什么的

这个模块是DeerFlow的微信接入通道。

这个模块把微信iLink平台和DeerFlow智能体连接起来。

用户在微信里发消息。

这个模块接收消息。

这个模块把消息交给DeerFlow处理。

DeerFlow处理后产生回复。

这个模块把回复发回微信。

这个模块使用long-polling方式连接iLink。

long-polling方式不需要公网IP。

这个模块没有配置bot_token时支持二维码登录。

二维码登录让首次部署不用预先拿到token。

这个模块能收发文字、图片、文件。

出站媒体走AES-128-ECB加密上传。

入站媒体下载后解密。

这个模块有自己的认证状态持久化。

令牌和轮询游标存在本地文件里。

重启后不用重新扫码。

## 二、模块里的主要成员

### 1、枚举类型

`MessageItemType`定义消息条目类型。

类型包括NONE、TEXT、IMAGE、VOICE、FILE、VIDEO。

`UploadMediaType`定义上传媒体类型。

类型包括IMAGE、VIDEO、FILE、VOICE。

### 2、WechatChannel类

这个类是模块的核心。

这个类继承自`Channel`基类。

这个类实现了`start`、`stop`、`send`三个生命周期方法。

#### （1）类常量

这个类定义了大量默认值。

默认API基地址是`https://ilinkai.weixin.qq.com`。

默认CDN基地址是`https://novac2c.cdn.weixin.qq.com/c2c`。

默认轮询超时35秒。

默认重试延迟5秒。

默认二维码轮询间隔2秒、超时180秒。

默认入站图片上限20MB。

默认入站文件上限50MB。

默认媒体主机白名单是`qq.com`后缀。

默认允许的文件扩展名白名单覆盖常见文档和代码文件。

默认允许的MIME类型白名单覆盖常见文档格式。

#### （2）构造函数`__init__`

构造函数接收`bus`和`config`。

配置键很多。

核心键是`bot_token`。

`qrcode_login_enabled`允许首次二维码登录。

`base_url`和`cdn_base_url`覆盖API地址。

`allowed_users`限制用户。

`allowed_media_hosts`扩展媒体主机白名单。

各种超时参数只接受正有限秒数。

非法值回退到默认。

这样轮询不会进入热循环。

也不会永远睡眠。

构造函数刻意不加载持久化状态。

`ChannelService._start_channel`在异步路径直接构造通道。

`__init__`里做文件IO会阻塞事件循环。

严格的阻塞IO检查会在`os.stat`上抛BlockingError。

所以状态在`start`里用`asyncio.to_thread`加载。

#### （3）`start`和`stop`方法

`start`方法先在事件循环外加载持久化状态。

先加载令牌，再检查bot_token。

这样恢复的令牌能避免不必要的二维码登录。

`start`方法创建httpx客户端。

`start`方法订阅出站消息。

`start`方法启动轮询任务。

`stop`方法取消轮询任务。

`stop`方法关闭httpx客户端。

#### （4）`send`方法

`send`方法把文字回复发回微信。

微信的出站消息必须有`context_token`。

`context_token`来自入站消息。

`_resolve_context_token`按顺序解析。

先看出站元数据。

再看线程映射。

最后看会话映射。

找不到token就丢弃消息。

发送前确保已认证。

#### （5）`_send_image_attachment`和`_send_file_attachment`

这两个方法发送出站图片和文件。

发送流程分几步。

第一步检查大小上限和文件类型白名单。

第二步读取明文字节。

第三步生成随机AES密钥。

第四步请求`getuploadurl`获取上传URL。

第五步加密明文。

加密用`_encrypt_aes_128_ecb`。

第六步上传密文到CDN。

第七步构造消息条目并调用`sendmessage`。

图片条目带加密密钥和密文长度。

文件条目还带文件名、MD5、明文长度。

#### （6）`_poll_loop`方法

这个方法轮询iLink获取新消息。

这个方法处理认证。

未认证时等待重试延迟再试。

这个方法处理令牌过期。

`errcode`为-14表示令牌过期。

过期时清空令牌和游标。

保存状态。

停止通道。

提示用户重新扫码。

这个方法逐条处理消息。

每条消息有独立的try/except。

一条消息处理失败不会中断整批。

后面的消息还能继续处理。

游标只在整批处理完后推进。

不在循环前推进。

这样中途崩溃不会跳过未处理的消息。

重启后最多重复处理这一批。

不会静默跳过。

长轮询超时尊重服务端值。

服务端下发`longpolling_timeout_ms`。

客户端按这个值调整。

#### （7）`_handle_update`方法

这个方法处理单条入站消息。

只处理`message_type`为1的消息。

`chat_id`取发送者ID。

空ID直接丢弃。

先检查`/connect <code>`绑定命令。

绑定先于`allowed_users`检查。

这一点和其他通道一致。

然后检查用户白名单。

然后提取入站文件。

然后缓存`context_token`。

按会话和按线程各存一份。

然后构造`InboundMessage`。

`topic_id`为None。

iLink单聊共享一个线程。

轮询循环在Gateway主循环上顺序处理。

所以入站发布不需要预留机制。

直接用`_publish_inbound_or_drop`。

#### （8）二维码登录

`_ensure_authenticated`确保已认证。

先查内存令牌。

再查持久化状态。

最后走二维码登录。

`request_login_qrcode`请求二维码。

这个方法不改变运行中通道的凭据。

`request_login_status`轮询扫码状态。

`_bind_via_qrcode`执行完整绑定流程。

流程是请求二维码。

保存pending状态。

轮询状态直到confirmed。

确认成功保存令牌。

过期、取消、失败等状态抛异常。

超时抛TimeoutError。

#### （9）认证状态持久化

`_load_state`加载令牌和轮询游标。

`_save_state`保存轮询游标。

`_load_auth_state`加载认证状态。

`_save_auth_state`保存认证状态。

令牌文件用0o600权限写入。

写法是临时文件加原子重命名。

这样令牌不会短暂暴露在默认权限下。

chmod失败只记debug。

chmod失败不代表持久化失败。

#### （10）入站文件下载

`_extract_inbound_files`从消息里提取文件。

图片和文件分别处理。

每个附件的检查链很长。

检查一是`full_url`必须存在。

检查二是URL主机必须在白名单里。

主机白名单是点边界感知的。

`notqq.com`和`qq.com.evil.io`不会匹配`qq.com`。

白名单合并三部分。

默认的`qq.com`后缀。

操作者配置的`allowed_media_hosts`。

配置的`cdn_base_url`主机。

检查三是必须能解析出AES密钥。

密钥解析尝试多种形态。

hex、base64标准、base64 URL安全都试。

密钥可能出现在多个字段名下。

解析不出来时输出诊断信息。

诊断只记录字段类型和长度。

不记录密钥内容。

检查四是文件扩展名和MIME白名单。

然后下载密文。

`_download_cdn_bytes`流式下载。

下载有三个设计要点。

要点一是请求`Accept-Encoding: identity`。

要点二是拒绝任何残余的`Content-Encoding`。

要点三是用`aiter_raw`迭代。

httpx的透明解码会先分配完整解压体。

那样字节上限就失效了。

流式上限在中途生效。

超限在读完前中止。

明文上限和密文上限不同。

PKCS#7填充让密文比明文最多大一个16字节块。

`_stream_cap_for`把明文上限换算成密文上限。

正好到边界的合法附件不会被误拒。

解密后的精确检查仍是权威。

下载后解密。

解密后检查明文大小。

然后暂存到本地下载目录。

图片扩展名通过魔术字节检测。

PNG、JPEG、GIF、WebP、BMP都能识别。

#### （11）日志脱敏

`_media_url_host`只提取主机名用于日志。

CDN URL的查询串带访问凭据。

所以URL本体永远不会进日志。

`_media_download_error_summary`生成脱敏的异常摘要。

httpx异常的消息里带完整请求URL。

所以只记录异常类名和HTTP状态码。

原始异常不能到达`logger.exception`。

否则轮询循环会渲染出traceback。

#### （12）`_extract_text`方法

这个方法提取消息文本。

遍历`item_list`。

只取TEXT类型条目。

多段文本用换行拼接。

## 三、它和谁协作

### 1、它依赖谁

它依赖`app.channels.base`的`Channel`基类。

它依赖`app.channels.message_bus`的消息类型。

它依赖`app.channels.commands`的命令识别工具。

它依赖`app.channels.connection_identity`的身份解析。

它依赖外部库`httpx`和`cryptography`。

配置来自config.yaml的`channels.wechat`段。

### 2、谁调用它

`app.channels.service`按配置创建并启动它。

`ChannelManager`通过消息总线投递出站消息。

manager消费入站消息里的`path`字段读取已暂存的文件。

浏览器绑定流程的code由`app.gateway.routers.channel_connections`生成。

用户通过`/connect <code>`消息消费code。

## 四、重要性评级

### 1、评级

8分。

### 2、理由

这个模块是微信平台的完整接入层。

微信是国内用户最常用的IM。

它的覆盖面很大。

它要对接的iLink协议比较底层。

消息条目、AES加密、CDN上传下载都要自己处理。

它的安全设计很完整。

媒体URL主机白名单是SSRF防护。

文件类型白名单是内容防护。

令牌文件0o600加原子重命名是凭据防护。

日志脱敏防止凭据泄漏。

它处理了密文上限和明文上限的换算问题。

这个细节不处理会误拒合法附件。

它的状态持久化让重启不需要重新扫码。

它不是全系统的中枢。

单独一个平台通道缺失，系统其他部分照常工作。

所以评8分。

文件约1663行，是这批通道里最大的之一。

二维码登录让首次部署门槛大幅降低。
