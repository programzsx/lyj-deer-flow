# ChannelConnectionRow-档案

## 一、这个类是干什么的

ChannelConnectionRow是persistence/channel_connections/model.py里的ORM模型。

它是一个用户拥有的IM channel连接的行。

这个文档覆盖ChannelConnectionRow加ChannelCredentialRow、ChannelOAuthStateRow、ChannelConversationRow。

位于backend/packages/harness/deerflow/persistence/channel_connections/model.py。

## 二、类的成员（字段，各自做什么）

### 1、ChannelConnectionRow字段

id是连接id。主键。

owner_user_id是owner。有索引。

provider是平台名。例如lark、slack。有索引。

status是状态。默认connected。

external_account_id、external_account_name是外部账号。

workspace_id、workspace_name是工作区。

bot_user_id是bot用户id。

scopes_json是scopes列表。

capabilities_json是能力字典。

metadata_json是元数据字典。

last_seen_at、last_error_at是时间戳。

### 2、唯一约束

uq_channel_connection_owner_provider_identity约束(owner, provider, external_account_id, workspace_id)。

### 3、单活动owner不变量

uq_channel_connection_active_identity是部分唯一索引。

每个外部身份最多一个非撤销的行。

status != 'revoked'的where条件。

这让ownership transfer race-safe。

不同owner的并发connect不能再同时提交connected行。

部分唯一索引SQLite 3.8.0以上和PostgreSQL都支持。

### 4、ChannelCredentialRow字段

connection_id是外键。CASCADE删除。主键。

encrypted_access_token和encrypted_refresh_token是加密token。

token_type、expires_at、refresh_expires_at。

encrypted_extra_json是加密的额外数据。

version是乐观并发版本。默认1。

token由ChannelCredentialCipher加密。fernet:v1:前缀。

### 5、ChannelOAuthStateRow字段

state_hash是OAuth state哈希。主键。

owner_user_id、provider。

code_verifier_encrypted是加密的code verifier。PKCE。

nonce_hash是nonce哈希。

redirect_after、requested_scopes_json、metadata_json。

expires_at、consumed_at、created_at。

### 6、ChannelConversationRow字段

id是会话id。主键。

connection_id是外键。CASCADE。有索引。

owner_user_id、provider。

external_conversation_id、external_topic_id。

thread_id是绑定的DeerFlow thread。有索引。

uq_channel_conversation_connection_external约束唯一。

## 三、它和谁协作

- ChannelConnectionRepository操作这些行。
- ChannelCredentialCipher加密token。
- channels服务读写连接和会话。

## 四、重要性评级

评级是6分。

理由如下。

这个类是IM channel连接的持久化契约。

单活动owner不变量在数据库层强制。ownership transfer race-safe。

部分唯一索引跨SQLite和PostgreSQL。

token加密存储。version乐观并发。

OAuth state用PKCE。nonce哈希。

会话唯一约束。

这些是channel凭据安全的关键。

扣掉4分。

扣分原因是它是ORM行模型。逻辑在repository里。
