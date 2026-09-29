# ChannelCredentialCipher-档案

## 一、这个类是干什么的

ChannelCredentialCipher是persistence/channel_connections/sql.py里的类。

它在凭证持久化之前加密。

用Fernet对称加密。

IM渠道的提供者凭证以密文落库。

这个类位于backend/packages/harness/deerflow/persistence/channel_connections/sql.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、ChannelCredentialCipher本身

构造方法接受Fernet实例。

### 2、from_key方法

它从密钥字符串构建cipher。

SHA-256摘要转成Fernet密钥。

### 3、encrypt_text方法

它加密文本。

None返回None。

前缀fernet:v1:标识版本。

### 4、decrypt_text方法

它解密文本。

removeprefix去版本前缀。

### 5、ChannelConnectionRepository对照

它和ChannelCredentialCipher配合。

是渠道连接、凭证、会话的持久facade。

_encrypt_optional_secret加密凭证。

cipher缺失时抛RuntimeError。

upsert_connection在status为connected时撤销其他active owner。

一个外部账号只有一个active连接。

### 6、行模型

ChannelConnectionRow、ChannelCredentialRow、ChannelConversationRow、ChannelOAuthStateRow。

OAuth state行支持OAuth握手。

## 三、它和谁协作

- ChannelConnectionRepository用加密凭证。
- Fernet做对称加密。
- IM渠道管理器消费连接。

## 四、重要性评级

评级是6分。

理由如下。

这个类是渠道凭证加密的核心。

凭证永不明文落库。

Fernet对称加密。

版本前缀支持轮换。

cipher缺失时fail fast。

这些是凭证安全的关键。

扣掉4分。

扣分原因是它只覆盖渠道凭证。
