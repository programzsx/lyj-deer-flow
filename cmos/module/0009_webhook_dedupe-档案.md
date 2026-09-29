# 0009_webhook_dedupe档案

## 一、这个迁移是干什么的

创建跨pod的入站webhook去重表。修复issue #4120。多实例部署下webhook消息不能重复处理。

## 二、做了什么schema变更

- 创建`webhook_deliveries`表。channel、workspace_id、chat_id、message_id、first_seen。
- 复合主键`pk_webhook_deliveries`。四个身份字段。
- 索引`ix_webhook_deliveries_first_seen`。清理旧记录用。

## 三、涉及哪些表

只涉及`webhook_deliveries`表。

## 四、重要细节

复合主键镜像`ChannelManager._inbound_dedupe_key`。故意不用单个拼接的代理键。组件可能含有Postgres TEXT列不合法的字符（比如NUL）。拼接键还有长度溢出风险。

first_seen带服务器默认值now()。索引支持按时间清理。

## 五、重要性评级

评级是6分。

理由。这个表是多实例部署下webhook去重的持久化基础。没有它，IM消息会被重复处理。复合主键的设计避免了NUL字符和长度溢出问题。
