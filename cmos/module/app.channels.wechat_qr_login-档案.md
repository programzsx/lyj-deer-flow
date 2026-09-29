# app.channels.wechat_qr_login 档案

## 一、这个模块是干什么的

wechat_qr_login.py管理微信机器人的短时效浏览器扫码登录会话。

用户想接入微信通道。用户没有机器人凭据。用户在浏览器里发起扫码登录。这个模块创建一个临时会话。用户用微信扫码。模块轮询微信服务器拿登录状态。登录确认后拿到bot凭据。凭据被应用到通道配置并启动通道。

核心安全原则写在模块开头。bot凭据永不离开服务器。凭据不会出现在浏览器的会话响应里。

这个模块是进程内的单会话设计。同一时刻最多只有一个扫码登录会话。会话属于发起它的管理员。180秒过期。

日志只记规范化后的状态。绝不记URL、验证码、令牌或上游响应体。

## 二、模块里的主要成员

### 1、辅助与异常

- `_wechat_api_url(value)`。只接受腾讯微信选定的HTTPS来源。域名必须匹配`weixin.qq.com`的模式。操作员配置的base_url可配置。不可信的登录响应绝不能把轮询标识或bot令牌重定向到任意主机。
- `QRLoginError`。扫码登录异常。带`detail`和`status_code`。浏览器API用它返回4xx/5xx。

### 2、_Session类

一个扫码登录会话的数据类。

- `owner`。发起会话的管理员。
- `config`。通道配置快照。
- `id`。会话id。用`secrets.token_urlsafe(32)`生成。
- `expires_at`。过期时刻。创建后180秒。用`time.monotonic()`计时。
- `status`。会话状态。包括`pending`（等待扫码）、`scanned`（已扫码）、`verification_required`（需要验证码）、`confirmed`（已确认）、`failed`（失败）、`expired`（过期）。
- `qrcode`。微信返回的二维码标识。
- `content`。二维码图片内容。
- `provider`。凭据应用后的结果。
- `error`。规范化错误标记。
- `verify_code`。待提交的验证码。
- `poll_lock`。每个会话自己的轮询锁。防止同一会话并发轮询。
- `response()`。构造给浏览器的响应。只暴露id、状态、二维码内容、剩余秒数、provider和错误标记。绝不暴露bot凭据。

### 3、WechatQRLogin类

#### （1）构造

- `__init__()`。持有最多一个会话。持有一个`asyncio.Lock`。
- 设计原则。网络轮询在变更锁之外跑，这样取消操作可以隔离迟到的确认。凭据应用与手动配置和断开共享同一把锁。不保留任何后台任务、开放的客户端或令牌。

#### （2）会话生命周期

- `request(config, qrcode, verify_code)`。临时创建一个`WechatChannel`做网络调用。`qrcode`为None时请求登录二维码。否则查询登录状态。finally里保证通道被stop。不保留通道实例。
- `_get(owner, session_id)`。按属主和id取会话。找不到或属主不匹配抛404。活跃会话过期则标记为`expired`。
- `mutation()`。上下文管理器。持锁清空会话。给凭据应用和断开操作用。
- `start(owner, config)`。发起新会话。锁内检查是否已有另一个管理员的活跃会话。有则抛409。创建会话。锁外调`request`拿二维码。二维码无效则标记失败并抛502。锁内更新会话并返回响应。
- `cancel(owner, session_id)`。取消会话。锁内校验属主后清空会话。

#### （3）轮询与状态机

- `poll(owner, session_id, apply, verify_code)`。轮询登录状态的核心方法。`apply`是凭据应用回调。流程如下。先取会话。在会话自己的`poll_lock`内防并发轮询。非活跃状态直接返回。带`verify_code`时校验格式（1到16位数字）并记录。调用`request`查询微信。网络超时则标记`error="network"`返回。可重试的网络错误（传输错误、429、5xx）标记`error="network"`。不可重试的错误标记失败。拿到响应后进入锁内驱动状态机。
- 状态机规则。`confirmed`时提取bot_token。令牌缺失标记失败。令牌存在则构造凭据。`ilink_bot_id`可选。`baseurl`经过`_wechat_api_url`校验。然后调用`apply`应用凭据。应用失败抛502。成功后标记`confirmed`。
- `scaned_but_redirect`时用重定向主机更新base_url。IDC重定向是微信的区域切换。
- `need_verifycode`时进入`verification_required`状态。已提交过验证码时标记`verification_rejected`。
- `binded_redirect`标记已绑定。`verify_code_blocked`标记验证码被封锁。两者都标记失败。
- `expired`、`canceled`等状态映射为失败或过期。
- 等待和IDC重定向不确认已提交的验证码。验证码会一直重发，直到微信接受、拒绝或结束登录。

## 三、它和谁协作

### 1、它依赖谁

- `app.channels.wechat.WechatChannel`。实际的网络调用方。本模块临时创建通道实例做二维码请求和状态轮询。用完即stop。
- `app.channels.message_bus.MessageBus`。构造通道实例时需要传一个总线。
- `httpx`。HTTP错误类型的分类。

### 2、谁调用它

- `app.gateway.routers.channel_connections`。浏览器扫码登录API的router。管理员的浏览器请求经过它进入本模块。
- `tests/test_channel_connections_router.py`。测试。

### 3、用户流

管理员在浏览器点击连接微信。router调用`start`创建会话并拿二维码。浏览器展示二维码。管理员用微信扫码。浏览器反复调用`poll`。状态从`pending`到`scanned`，可能进入`verification_required`。最终`confirmed`。凭据被应用并启动微信通道。浏览器全程看不到凭据。

## 四、重要性评级

评级：5分。

理由：本模块解决微信通道的一个真实痛点。没有它，管理员必须手工拿到bot凭据再写进配置。扫码登录让接入变成浏览器里的几次点击。安全设计很用心：凭据不出服务器、域名白名单、单会话互斥、日志脱敏、验证码防重放。但它的作用范围只限微信这一个平台的接入流程。会话是短时效的、一次性的。它不参与消息的主链路。微信通道没配好时其他通道照常工作。代码量200多行。所以评5分：接入体验上重要，安全设计到位，但不属于消息主链路。
