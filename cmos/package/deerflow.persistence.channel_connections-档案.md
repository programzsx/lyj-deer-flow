# deerflow.persistence.channel_connections-档案

源码路径：backend/packages/harness/deerflow/persistence/channel_connections/__init__.py

## 一、这个包是干什么的

这个包负责用户持有的IM渠道连接的持久化。

IM渠道包括飞书、Slack、Telegram、Discord、钉钉。

用户把这些平台账号连接到DeerFlow。

这个包存连接信息、凭据、OAuth状态、会话映射。

这个包管理四张表。

表是channel_connections、channel_credentials、channel_oauth_states、channel_conversations。

## 二、包里的主要成员

（1）model.py的四个Row

ChannelConnectionRow对应channel_connections表。

一行代表一个用户的一条渠道连接。

字段包括id、owner_user_id、provider、status。

status默认是connected。

还有外部账号信息。

字段包括external_account_id、external_account_name、workspace_id、workspace_name、bot_user_id。

还有scopes_json、capabilities_json、metadata_json。

还有时间字段。

字段包括created_at、updated_at、last_seen_at、last_error_at。

(owner_user_id, provider, external_account_id, workspace_id)上有UNIQUE约束。

还有一个部分唯一索引。

索引是uq_channel_connection_active_identity。

同一个外部身份最多有一个非revoked的行。

这个约束让属主转移是竞态安全的。

ChannelCredentialRow对应channel_credentials表。

这张表存加密后的凭据。

主键是connection_id。

外键指向channel_connections.id。

级联删除。

字段包括encrypted_access_token、encrypted_refresh_token、token_type。

还有expires_at、refresh_expires_at、encrypted_extra_json、version。

ChannelOAuthStateRow对应channel_oauth_states表。

这张表存OAuth授权过程中的临时state。

主键是state_hash。

state本身不存，存的是SHA-256。

字段包括owner_user_id、provider、code_verifier_encrypted、nonce_hash。

还有redirect_after、requested_scopes_json、expires_at、consumed_at。

ChannelConversationRow对应channel_conversations表。

这张表把外部会话映射到DeerFlow的thread_id。

一行代表一个外部会话。

字段包括connection_id、owner_user_id、provider、external_conversation_id、external_topic_id、thread_id。

(connection_id, external_conversation_id, external_topic_id)上有UNIQUE约束。

（2）sql.py的ChannelCredentialCipher

这个类在凭据落库前加密。

加密用Fernet。

key是SHA-256摘要转成的urlsafe base64。

密文带fernet:v1:前缀。

（3）sql.py的ChannelConnectionRepository

这个类是连接、凭据、会话的持久化门面。

方法如下。

upsert_connection插入或更新连接。

并发写冲突时最多重试3次。

每次重试重读可见状态。

连上时先撤销其他属主的活跃行。

撤销动作发生在自己的行flush之前。

这样部分唯一索引在commit时能满足。

list_connections列出某用户的所有连接。

disconnect_connection把连接标记为revoked。

同时删掉凭据。

disconnect_provider_connections撤销某provider的全部活跃连接。

这是实例级移除provider时用的。

store_credentials加密并存凭据。

version每次递增。

get_credentials解密并返回凭据。

解密失败时返回None并打warning。

凭据不可用不能让请求崩。

hash_state把state转成SHA-256。

create_oauth_state创建OAuth state行。

create_oauth_state_within_cap带pending数量上限。

这个方法在一个事务里删过期加计数加插入。

Postgres用advisory lock串行化。

SQLite靠DELETE先拿到的写锁串行化。

并发connect请求不能都看到count小于上限然后都插入。

那样会漏过上限。

consume_oauth_state消费一个state。

消费用条件UPDATE。

只有把consumed_at从NULL翻转的写者赢。

两个并发worker不能都消费同一个绑定码。

find_connection_by_external_identity按外部身份找活跃连接。

set_thread_id和get_thread_id维护会话到thread的映射。

## 三、它和谁协作

app.channels.service调用这个仓库。

ChannelManager的worker循环用它找连接、存会话映射。

Gateway的channel_connections路由用它服务HTTP请求。

OAuth授权流程用oauth state的方法。

这个仓库依赖engine.py的session工厂。

凭据加密需要配置的加密key。

## 四、重要性评级

评级：6分。

理由：

IM渠道集成是产品的重要入口。

连接丢失意味着IM消息进不来。

凭据加密涉及安全。

但IM渠道是可选功能。

不用IM的用户完全不碰这些表。

核心的run和thread数据不在这里。

所以这个包是6分。
