# deerflow.config.dedupe_storage_config-档案

## 一、这个模块是干什么的

这个模块管理入站webhook去重存储的配置。

IM渠道会收到webhook消息。

多副本部署时同一个webhook可能送达多个pod。

去重状态需要跨pod共享。

问题编号是issue #4120。

这个配置决定去重状态存哪。

## 二、模块里的主要成员

### 1、DedupeStorageConfig类

`backend`选存储后端。

三种选择。

`auto`是自动选择。

数据库后端是postgres时用postgres应用库。

否则用进程内存储。

`memory`强制进程内存储。

单副本。

副本之间不共享。

`postgres`强制用应用库共享去重状态。

跨pod有效。

## 三、它和谁协作

`app_config.py`的`dedupe_storage`字段是这份配置。

这个字段是启动专用的。

去重存储工厂在ChannelService构造时解析一次。

解析结果被捕获到ChannelManager上。

不会因config.yaml编辑而重建。

## 四、重要性评级

评级：5分。

理由：跨pod去重是多副本IM部署的正确性问题。auto模式的推导逻辑是核心。配置面小，只有一个字段。
