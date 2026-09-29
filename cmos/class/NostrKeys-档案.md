# NostrKeys档案

## 一、这个类是干什么的

NostrKeys是Nostr密钥对的数据类。

它保存一个Nostr身份的私钥和公钥。

Buzz渠道用它签名事件。

每个发往中继的事件都要用私钥签名。

签名用BIP-340的Schnorr算法。

它是一个冻结的数据类。

定义在buzz_nostr模块里。

那个模块是Buzz渠道的纯Nostr协议帮助层。

没有IO，没有时钟。

## 二、类的成员

### （一）字段

1、secret

私钥。

是32字节的bytes。

2、pubkey_hex

公钥。

是32字节的十六进制字符串。

公钥是事件里的pubkey字段。

也是白名单和成员通知匹配的身份标识。

## 三、它和谁协作

NostrKeys是Buzz渠道的身份凭证。

它由buzz_nostr.parse_private_key创建。解析时用coincurve从私钥推导公钥。

它被BuzzChannel持有。渠道用它的pubkey_hex做自事件过滤、成员通知匹配、提及识别。

它被事件构造函数使用。build_auth_event、build_chat_event、build_edit_event都用它签名事件。

签名通过coincurve的Schnorr实现完成。coincurve在可选的buzz依赖extra里，懒加载。

## 四、重要性评级

评级：4分。

理由如下。

它是Buzz渠道的身份核心。

没有它，渠道无法签名任何事件，无法认证，无法发言。

它只是一个两字段的数据类。逻辑全部在使用它的签名函数里。

它只在Buzz渠道里使用。所以只有4分。
