# ChannelCredentialRow-档案

## 一、这个类是干什么的

ChannelCredentialRow是persistence/channel_connections/model.py里的ORM模型。

它是IM channel连接的凭据行。

和连接行一一对应。CASCADE删除。

这个类位于backend/packages/harness/deerflow/persistence/channel_connections/model.py。

## 二、类的成员（字段，各自做什么）

### 1、字段

connection_id是外键。指向channel_connections.id。CASCADE删除。主键。

encrypted_access_token是加密的access token。可None。

encrypted_refresh_token是加密的refresh token。可None。

token_type是token类型。可None。

expires_at是过期时间。

refresh_expires_at是refresh token过期时间。

encrypted_extra_json是加密的额外数据。

version是乐观并发版本。默认1。

updated_at是更新时间。

### 2、token加密

token由ChannelCredentialCipher加密。

存储带fernet:v1:前缀。

解密时按前缀识别格式。

### 3、version乐观并发

version是整数。默认1。

凭据更新用ordered key patch。避免行锁循环。

## 三、它和谁协作

- ChannelConnectionRepository操作它。
- ChannelCredentialCipher加密和解密token。
- ChannelConnectionRow是它的父行。

## 四、重要性评级

评级是5分。

理由如下。

这个类是channel凭据的持久化契约。

token加密存储。明文永不落库。

version乐观并发。ordered key patch避免锁循环。

CASCADE删除跟随连接。

这些是凭据安全的关键。

扣掉5分。

扣分原因是它是ORM行模型。
