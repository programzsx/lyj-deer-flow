# deerflow.persistence.webhook_delivery-档案

源码路径：backend/packages/harness/deerflow/persistence/webhook_delivery/__init__.py

## 一、这个包是干什么的

这个包负责入站webhook去重表的ORM模型。

IM平台的webhook会重复投递。

同一条消息可能被投递到不同的gateway pod。

去重表记录某条webhook已经投递过。

重复投递会被丢弃。

这个包对应数据库里的webhook_deliveries表。

这个包只有模型。

行的读写走原始SQL。

读写位置是app.channels.dedupe_store.PostgresInboundDedupeStore。

## 二、包里的主要成员

（1）model.py的WebhookDeliveryRow

WebhookDeliveryRow对应webhook_deliveries表。

一行代表一条已投递的入站webhook。

字段如下。

channel是渠道名。

workspace_id是工作区id。

chat_id是聊天id。

message_id是消息id。

first_seen是首次见到的时间。

first_seen有服务端默认值。

first_seen上有索引。

索引用于过期清理。

主键是四个字段的复合主键。

四个字段是channel、workspace_id、chat_id、message_id。

复合主键完全对应ChannelManager的_inbound_dedupe_key四元组。

直接用四列。

不用字符串拼接的代理键。

原因有两个。

原因是组件里可能含非法字符。

NUL在单个PostgresTEXT列里是非法的。

原因是ON CONFLICT目标保持自然。

过期用懒清理。

清理删除first_seen早于TTL的行。

TTL是INBOUND_DEDUPE_TTL_SECONDS。

## 三、它和谁协作

app.channels.dedupe_store读写这张表。

ChannelManager的worker循环用它去重入站消息。

多pod部署时去重靠这张共享表。

不同pod都能看到同一行。

数据库表由持久层的Alembic引导创建。

migration 0009建了这张表。

models包注册了这个Row。

## 四、重要性评级

评级：3分。

理由：

这张表只解决webhook重复投递。

去重失败最多造成一条消息被处理两次。

不影响run执行。

不影响thread管理。

不影响认证。

这张表是渠道集成的辅助数据。

行读写甚至不在这个包里。

所以这个包是低分的3分。
