# app.channels.connection_identity-档案

## 一、这个模块是干什么的

这个文件提供一个小工具函数。

工具的作用是把持久化的渠道连接归属信息附加到入站消息上。

用户可以在浏览器上把自己的平台账号绑定到渠道。

绑定关系被持久化保存。

平台消息进来时需要查出这条消息属于哪个绑定。

查到后消息就带上了连接ID、归属用户ID、工作区ID。

下游就能按归属用户处理消息。

## 二、模块里的主要成员

### 1、attach_connection_identity函数

attach_connection_identity是异步函数。

函数入参是入站消息inbound、仓库repo、平台名provider、工作区IDworkspace_id。

函数还接受fallback_without_workspace开关。

函数的流程分几步。

第一步是检查仓库。

仓库为None就直接返回原消息。

没有仓库就没有可查的绑定。

第二步是构造工作区候选列表。

有workspace_id就先放workspace_id。

开了fallback_without_workspace再把None放进去。

候选列表为空就直接返回原消息。

第三步是逐个候选查找连接。

函数调用repo的find_connection_by_external_identity。

查找键是provider加inbound.user_id加工作区候选。

查到连接就把连接信息写进消息。

写入的字段是connection_id和owner_user_id。

还写入workspace_id。

写完就返回消息。

全部候选都没查到就返回原消息。

原消息不带连接信息。

## 三、它和谁协作

它依赖app.channels.message_bus里的InboundMessage。

repo参数由调用方传入。

仓库实现是deerflow.persistence.channel_connections里的SQL仓库。

调用方是各渠道worker。

Slack、Discord、飞书、钉钉、微信、企业微信的worker在消息进入ChannelManager之前调用它。

这些worker用函数把平台身份解析成连接记录。

## 四、重要性评级

评级是5分。

理由是用户绑定功能依赖这个函数。

没有它，入站消息带不上connection_id和owner_user_id。

owner_user_id是运行时的user_id来源。

丢失归属信息会让消息落到默认用户上。

不评高分的原因是它只是一个查询加字段赋值的小工具，逻辑单一，出问题也好定位。
