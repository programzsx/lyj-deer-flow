# WebhookDeliveryRow-档案

## 一、这个类是干什么的

WebhookDeliveryRow是persistence/webhook_delivery/model.py里的ORM模型。

这个类是共享的入站webhook去重表的ORM行。

对应issue #4120。

一行记录某个入站webhook已经被派发过。

去重键是_inbound_dedupe_key四元组。

重放被路由到不同Gateway pod时仍然作为重复被丢弃。

行通过惰性清理过期。

PostgresInboundDedupeStore删除比INBOUND_DEDUPE_TTL_SECONDS老的行。

用first_seen列。

这个类位于backend/packages/harness/deerflow/persistence/webhook_delivery/model.py。

## 二、类的成员（字段，各自做什么）

字段如下。

- channel是渠道名。String(64)。不可空。
- workspace_id是工作区id。String(512)。不可空。
- chat_id是聊天id。String(512)。不可空。
- message_id是消息id。String(1024)。不可空。
- first_seen是首次看到时间。带时区。server_default用func.now()。

复合主键精确镜像ChannelManager._inbound_dedupe_key。

就是(channel, workspace_id, chat_id, message_id)。

直接用四列。

避免任何字符串拼接的代理键。

原因是组件可能包含字符。

例如NUL。

NUL在单个Postgres TEXT列里非法。

四列也让ON CONFLICT目标自然。

## 三、它和谁协作

- PostgresInboundDedupeStore读写这个模型。
- ChannelManager的去重逻辑用同一个四元组键。
- 惰性清理删除过期行。

## 四、重要性评级

评级是5分。

理由如下。

这个模型是跨pod webhook去重的基础。

四列复合主键镜像去重键。

避免NUL字符在代理键里非法的问题。

重放到不同pod仍然被丢弃。

这是issue #4120的解法。

但它是纯数据模型。

只有五个字段。

扣掉5分。
