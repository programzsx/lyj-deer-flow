# deerflow.persistence.webhook_delivery.model-档案

## 一、这个模块是干什么的

这个模块定义共享的入站webhook去重表的ORM模型。

模型类叫WebhookDeliveryRow。

模型对应数据库里的webhook_deliveries表。

这张表由issue #4120引入。

外部平台会重发webhook。

重发的消息不能被处理两次。

这张表记录哪些webhook已经被处理过。

重发的消息被当作重复丢弃。

即使重发被路由到不同的gateway pod。

pod是Gateway的一个实例。

多个pod共享同一个数据库。

所以任何pod都能查到去重记录。

## 二、模块里的主要成员

### 1、WebhookDeliveryRow类

WebhookDeliveryRow继承自Base。

WebhookDeliveryRow对应webhook_deliveries表。

#### （1）四个键列

channel是渠道名。

workspace_id是工作区id。

chat_id是聊天id。

message_id是消息id。

四个列组成复合主键。

主键名是pk_webhook_deliveries。

复合主键精确镜像ChannelManager._inbound_dedupe_key。

去重键是一个四元组。

四个列直接做主键。

不用字符串拼接的代理键。

这很重要。

原因有两个。

原因一是四个组件可能包含非法字符。

比如NUL字符。

NUL在单个Postgres TEXT列里是非法的。

直接用四列避免了这个问题。

原因二是ON CONFLICT目标保持自然。

#### （2）first_seen列

first_seen是这个消息第一次被看到的时间。

DateTime类型。

时区是UTC。

server_default用func.now()。

#### （3）索引

有索引ix_webhook_deliveries_first_seen。

first_seen上的索引服务懒清理。

行通过懒清理过期。

清理删掉比INBOUND_DEDUPE_TTL_SECONDS老的行。

TTL秒数是去重记录的存活时间。

清理按first_seen列判断年龄。

## 三、它和谁协作

### 1、它依赖谁

它依赖deerflow.persistence.base的Base。

### 2、谁依赖它

ChannelManager用它做入站消息去重。

去重存储的实现是PostgresInboundDedupeStore。

migrations/versions/0001_baseline.py创建这张表。

0009_webhook_dedupe.py处理去重相关的迁移。

bootstrap.py的canonical-0019 floor列出这张表的列。

## 四、重要性评级

评级是6分。

理由如下。

IM渠道的消息去重全靠这张表。

没有去重的话外部平台的重发会让同一条消息被处理两次。

复合主键的设计理由在这里被记录。

NUL字符的陷阱在这里被避开。

扣分的原因是它是纯模型文件。

只有五个列。

去重是渠道集成的一个辅助机制。

## 四、补充说明

去重记录过期靠懒清理。

懒清理在PostgresInboundDedupeStore里实现。

这个模块只定义表结构。
