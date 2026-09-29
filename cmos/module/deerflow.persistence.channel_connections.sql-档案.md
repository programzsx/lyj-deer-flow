# deerflow.persistence.channel_connections.sql-档案

## 一、这个模块是干什么的

这个模块是用户绑定的IM渠道连接的SQL仓库。

仓库类叫ChannelConnectionRepository。

这个模块是渠道连接、凭证、会话映射的持久化门面。

这个模块还包含一个凭证加密器。

加密器叫ChannelCredentialCipher。

加密器用Fernet加密平台凭证。

凭证加密后才落库。

## 二、模块里的主要成员

### 1、ChannelCredentialCipher类

这个类加密provider凭证。

#### （1）from_key方法

from_key从字符串密钥构造加密器。

密钥先做SHA-256摘要。

摘要再转成Fernet密钥。

#### （2）encrypt_text方法和decrypt_text方法

encrypt_text加密文本。

密文带fernet:v1:前缀。

None保持None。

decrypt_text解密文本。

先剥掉前缀再解密。

### 2、ChannelConnectionRepository类

这个类持有会话工厂。

这个类的方法覆盖连接、凭证、OAuth状态、会话映射。

#### （1）upsert_connection方法

upsert_connection插入或更新连接。

状态是connected时。

先撤销其他拥有者对这个外部身份的活跃行。

撤销在写入自己的行之前。

这样部分唯一索引在提交时能被满足。

撤销同时删除那些连接的凭证。

并发写入者提交了冲突行时。

IntegrityError触发回滚重试。

重试上限是3次。

每次重试重新读当前可见的状态。

#### （2）list_connections方法

list_connections列出某用户的全部连接。

按updated_at倒序。

#### （3）disconnect_connection方法

断开一个连接。

校验拥有者。

状态改成revoked。

凭证被删除。

#### （4）disconnect_provider_connections方法

撤销某provider的全部活跃连接。

这服务实例级provider移除。

#### （5）store_credentials方法和get_credentials方法

store_credentials加密并存储凭证。

版本号自增。

get_credentials解密并返回凭证。

解密失败时记warning。

凭证被视为不可用。

#### （6）create_oauth_state方法

创建OAuth状态行。

state先做SHA-256哈希。

#### （7）create_oauth_state_within_cap方法

这个方法原子地强制每个(拥有者, provider)的待定上限。

删除过期码、计数、插入在单个事务里。

PostgreSQL用事务级advisory锁串行化。

SQLite靠开头的DELETE拿到写锁。

并发连接请求不能各自看到count小于上限然后全部插入。

全部插入会突破上限。

插入成功返回True。

已达上限返回False。

#### （8）consume_oauth_state方法

这个方法消费一个绑定码。

先删过期码。

条件UPDATE保证两个并发worker不能都消费同一个码。

只有把consumed_at从NULL翻成时间的那个写入者赢。

rowcount不是1就返回None。

#### （9）find_connection_by_external_identity方法

按外部身份找活跃连接。

#### （10）set_thread_id方法和get_thread_id方法

设置和查询外部会话到线程的映射。

不存在就插入。

存在就更新。

## 三、它和谁协作

### 1、它依赖谁

它依赖channel_connections/model.py的四个模型。

它依赖cryptography库的Fernet。

它依赖deerflow.utils.time的coerce_iso。

它依赖persistence.engine的close_engine。

### 2、谁依赖它

app层的channels服务用它管理绑定和OAuth流程。

ChannelManager靠get_thread_id路由入站消息。

## 四、重要性评级

评级是7分。

理由如下。

渠道集成的全部持久化逻辑在这里。

凭证加密在这里落地。

OAuth状态的上限和一次性消费都有原子保证。

所有权转移的竞态处理很完整。

扣分的原因是它服务渠道集成一条链路。

其他模块不依赖它。
