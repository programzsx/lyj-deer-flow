# ChannelOAuthStateRow-档案

## 一、这个类是干什么的

ChannelOAuthStateRow是persistence/channel_connections/model.py里的ORM模型。

它是IM channel OAuth授权状态的行。

state_hash是主键。

这个类位于backend/packages/harness/deerflow/persistence/channel_connections/model.py。

## 二、类的成员（字段，各自做什么）

### 1、字段

state_hash是OAuth state的哈希。String(128)。主键。

owner_user_id是发起授权的owner。有索引。

provider是平台名。有索引。

code_verifier_encrypted是加密的PKCE code verifier。可None。

nonce_hash是nonce哈希。可None。

redirect_after是授权后的重定向。可None。

requested_scopes_json是请求的scopes。

metadata_json是元数据。

expires_at是过期时间。非空。

consumed_at是消费时间。可None。

created_at是创建时间。

### 2、PKCE支持

code_verifier是PKCE的核心。

加密存储。state匹配时解密。

### 3、state和nonce哈希

state和nonce都存哈希。

原始值只在start响应里给浏览器。

### 4、一次性消费

consumed_at标记已消费。

过期和已消费的state被拒绝。

## 三、它和谁协作

- ChannelConnectionRepository操作它。
- channels服务的auth start和complete流程使用它。

## 四、重要性评级

评级是5分。

理由如下。

这个类是OAuth授权状态的持久化契约。

state和nonce存哈希。原始值不落库。

PKCE code verifier加密存储。

一次性消费加过期。

这些是OAuth流程安全的关键。

扣掉5分。

扣分原因是它是ORM行模型。
