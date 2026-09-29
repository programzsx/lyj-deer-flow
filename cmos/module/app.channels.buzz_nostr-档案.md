# app.channels.buzz_nostr 档案

## 一、这个模块是干什么的

buzz_nostr.py是Buzz通道连接器的纯Nostr协议工具层。

Nostr是一个去中心化社交协议。NIP-01是它的事件规范。BIP-340是它用的Schnorr签名规范。

这个模块没有任何I/O。没有墙钟调用。调用者自己提供`created_at`时间戳。这样设计让整个模块可以在测试里完全确定地跑。

这个模块只做三件事。第一件事是密钥解析。第二件事是事件的构造、签名和验证。第三件事是Nostr线缆格式的帧构造。

签名依赖`coincurve`库。`coincurve`在可选的`buzz`依赖组里。导入是惰性的。这样应用的其他部分不需要装它。

## 二、模块里的主要成员

### 1、密钥与地址解析

- `NostrKeys`。冻结的dataclass。存`secret`（私钥字节）和`pubkey_hex`（公钥十六进制）。
- `_bech32_polymod(values)`。bech32校验和计算。
- `_bech32_decode(expected_hrp, value)`。bech32解码。校验hrp前缀、字符集、校验和、负载长度。只接受32字节负载。
- `_parse_32_bytes(value, bech_hrp)`。统一的32字节解析入口。`nsec1...`或`npub1...`开头的走bech32解码。否则按64位hex解析。两种形式都要求恰好32字节。
- `parse_private_key(value)`。解析私钥。支持nsec格式和hex格式。通过coincurve算出公钥。返回`NostrKeys`。
- `parse_pubkey(value)`。解析公钥。支持npub格式和hex格式。返回十六进制字符串。
- `_require_coincurve()`。惰性导入coincurve。缺库时抛`RuntimeError`并附带安装提示。
- `COINCURVE_INSTALL_HINT`。缺库时的安装指引文案。

### 2、事件构造与验证

- `event_id(pubkey_hex, created_at, kind, tags, content)`。按NIP-01规范重算事件id。序列化形式是`[0, pubkey, created_at, kind, tags, content]`。SHA-256哈希。`ensure_ascii=False`保留非ASCII原文。
- `sign_event(keys, kind, tags, content, created_at)`。构造完整事件。算id后用coincurve做Schnorr签名。返回带`id`、`pubkey`、`sig`等完整字段的字典。
- `verify_event(event)`。验证事件。这是本模块安全上最重要的函数。做两个独立检查。第一个检查是重算NIP-01事件id并和声称的`id`比对。第二个检查是用声称的`pubkey`验证Schnorr签名。两个检查都必须通过。这个函数对任何输入都返回布尔值，永不抛异常。缺字段、类型错、非hex、长度错、甚至不是字典，都一律返回False。布尔值被显式排除在数字字段之外。因为JSON的`true`是int子类，否则会悄悄改变规范化序列化。
- 事件kind常量。`KIND_CHAT`（9）是聊天消息。`KIND_EDIT`（40003）是原地编辑。`KIND_AUTH`（22242）是NIP-42认证。`KIND_CHANNEL_META`（39000）是频道元数据。`KIND_MEMBER_ADDED`（44100）和`KIND_MEMBER_REMOVED`（44101）是中继签名的成员变更通知。每个成员通知携带`p`标签（受影响的成员）和`h`标签（频道uuid）。

### 3、事件构造辅助

- `build_auth_event(keys, relay_url, challenge, created_at)`。构造NIP-42认证事件。带`relay`和`challenge`标签。
- `build_chat_event(keys, channel_id, content, created_at, reply_to, mentions)`。构造聊天事件。带`h`标签（频道）。可选`e`标签（线程回复）。可选多个`p`标签（提及）。
- `build_edit_event(keys, channel_id, target_event_id, content, created_at)`。构造编辑事件。kind-40003只带`h`和`e`标签。所以编辑事件上不能携带提及。

### 4、线缆帧构造

- `req_frame(sub_id, *filters)`。构造`["REQ", sub_id, ...]`帧。用于发起订阅。
- `event_frame(event)`。构造`["EVENT", event]`帧。用于发布事件。
- `close_frame(sub_id)`。构造NIP-01`CLOSE`帧。只停掉一条订阅，不断开socket。聊天订阅是按频道的。所以被移出某个频道时必须精确关掉那一条订阅。
- `tag_values(event, name)`。提取事件tags里某名字的所有值。

## 三、它和谁协作

### 1、它依赖谁

- `coincurve`库。做BIP-340 Schnorr签名和验证。可选依赖。惰性导入。
- Python标准库的`hashlib`和`json`。做SHA-256和序列化。

### 2、谁调用它

- `app.channels.buzz`。唯一的调用方。buzz.py在启动时用`parse_private_key`解析密钥。在`handle_relay_frame`里用`verify_event`验证每个入站事件。在构造订阅、认证、聊天、编辑事件时用各个`build_*`和帧构造函数。

### 3、它的设计位置

这个模块被刻意设计成纯函数层。它不持有任何状态。不发起任何网络请求。所有副作用都留在buzz.py里。这让签名和验证逻辑可以被独立地、确定性地测试。

## 四、重要性评级

评级：6分。

理由：本模块是Buzz通道的安全基座。`verify_event`是全部入站事件的可信性来源。没有这个函数，恶意中继可以伪造任何白名单作者的发言并触发真实agent运行。事件构造和帧构造也是Buzz通道与中继通信的全部出入口。但本模块是可选依赖`buzz` extra的一部分。它只服务于buzz.py一个调用方。它本身没有复杂状态和生命周期。代码量小、职责清晰、边界明确。所以评6分：安全上关键，但范围窄、结构简单。
