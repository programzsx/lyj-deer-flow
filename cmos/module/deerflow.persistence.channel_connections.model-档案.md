# deerflow.persistence.channel_connections.model-档案

## 一、这个模块是干什么的

这个模块定义用户绑定的IM渠道连接的ORM模型。

IM渠道指飞书、Slack、Telegram、Discord、钉钉这些平台。

用户通过OAuth把自己的平台账号绑定到DeerFlow。

绑定关系存在这些表里。

这个模块定义四个模型。

四个模型对应四张表。

四张表是channel_connections、channel_credentials、channel_oauth_states、channel_conversations。

## 二、模块里的主要成员

### 1、ChannelConnectionRow类

ChannelConnectionRow对应channel_connections表。

一行代表一个用户绑定的外部账号连接。

#### （1）身份字段

owner_user_id是拥有者。

provider是平台名。

external_account_id是外部账号id。

external_account_name是外部账号名。

workspace_id和workspace_name是工作区信息。

bot_user_id是机器人用户id。

#### （2）状态字段

status是连接状态。

默认connected。

断开时变成revoked。

#### （3）JSON字段

scopes_json存授权范围列表。

capabilities_json存能力字典。

metadata_json存元数据字典。

#### （4）时间字段

created_at和updated_at是创建和更新时间。

last_seen_at是最后活跃时间。

last_error_at是最后出错时间。

#### （5）约束和索引

有一个唯一约束。

约束是(owner_user_id, provider, external_account_id, workspace_id)。

这个约束防止同一用户重复绑定同一身份。

有一个事件查找索引。

索引是(provider, workspace_id, bot_user_id)。

还有一个部分唯一索引。

索引是uq_channel_connection_active_identity。

条件是status != 'revoked'。

这个索引在数据库层强制单活跃拥有者不变量。

一个外部身份最多有一个未撤销的行。

这让所有权转移是竞态安全的。

并发连接来自不同拥有者时。

两个不能都提交connected行。

部分唯一索引SQLite和PostgreSQL都支持。

### 2、ChannelCredentialRow类

ChannelCredentialRow对应channel_credentials表。

一行存一个连接的加密凭证。

connection_id是主键。

connection_id是外键。

外键指向channel_connections.id。

级联删除。

encrypted_access_token是加密的访问令牌。

encrypted_refresh_token是加密的刷新令牌。

token_type是令牌类型。

expires_at和refresh_expires_at是过期时间。

encrypted_extra_json是加密的额外数据。

version是版本号。

### 3、ChannelOAuthStateRow类

ChannelOAuthStateRow对应channel_oauth_states表。

一行代表一次OAuth流程的临时状态。

state_hash是主键。

state的SHA-256哈希。

原始state不落库。

owner_user_id和provider标识发起者。

code_verifier_encrypted是加密的PKCE验证码。

nonce_hash是nonce的哈希。

redirect_after是登录后跳转地址。

requested_scopes_json是请求的范围。

expires_at是过期时间。

consumed_at是消费时间。

### 4、ChannelConversationRow类

ChannelConversationRow对应channel_conversations表。

一行代表外部会话和DeerFlow线程的映射。

connection_id是外键。

级联删除。

external_conversation_id是外部会话id。

external_topic_id是外部话题id。

thread_id是DeerFlow线程id。

有唯一约束(connection_id, external_conversation_id, external_topic_id)。

## 三、它和谁协作

### 1、它依赖谁

它依赖deerflow.persistence.base的Base。

### 2、谁依赖它

channel_connections/sql.py的ChannelConnectionRepository用这四个模型读写。

app层的channel服务通过repository使用这些表。

migrations/versions/0001_baseline.py创建前四张表的baseline部分。

## 四、重要性评级

评级是7分。

理由如下。

IM渠道接入全靠这些表。

单活跃拥有者的部分唯一索引是关键安全设计。

所有权转移因此变成竞态安全的。

凭证表存加密数据。

OAuth状态表只存哈希不存原始值。

扣分的原因是这些表只服务渠道集成一条链路。

其他模块不依赖它。
