# ChannelConnectionRepository-档案

## 一、这个类是干什么的

ChannelConnectionRepository是persistence/channel_connections/sql.py里的类。

它是渠道连接、凭证、会话的持久facade。

IM渠道的连接管理。

它管理连接行、加密凭证行、OAuth state行、会话行。

这个类位于backend/packages/harness/deerflow/persistence/channel_connections/sql.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、upsert_connection方法

它更新或创建连接行。

status为connected时撤销其他active owner。

一个外部账号只有一个active连接。

### 2、list_connections方法

返回owner的连接列表。按updated_at降序。

### 3、disconnect_connection方法

断开连接。状态设revoked。删除凭证行。

不拥有时返回False。

### 4、disconnect_provider_connections方法

它撤销一个provider的所有活跃用户连接。

实例级provider移除用。

批量撤销。批量删凭证。

### 5、store_credentials方法

它存储加密凭证。

access_token、refresh_token、extra都加密。

version递增。

cipher缺失时抛RuntimeError。

### 6、get_credentials方法

它解密凭证。

解密失败时警告。把凭证当不可用。

InvalidToken、UnicodeError、JSONDecodeError都处理。

### 7、OAuth state

create_oauth_state创建OAuth握手state。

state以SHA-256摘要存储。不存明文。

带code_verifier、nonce_hash、redirect_after。

delete_expired_oauth_states清理过期state。

### 8、get_thread_id

会话到线程的映射。

### 9、行模型

ChannelConnectionRow是连接行。

ChannelCredentialRow是加密凭证行。

ChannelConversationRow是会话行。

ChannelOAuthStateRow是OAuth state行。

## 三、它和谁协作

- ChannelCredentialCipher加密凭证。
- IM渠道管理器消费连接和凭证。
- OAuth握手流程。

## 四、重要性评级

评级是7分。

理由如下。

这个仓库是IM渠道连接的持久核心。

凭证全程加密。

state以摘要存储。

单active owner约束。

解密失败当凭证不可用。不崩。

provider移除的批量撤销。

这些是渠道安全的关键。

扣掉3分。

扣分原因是它是数据访问层。
