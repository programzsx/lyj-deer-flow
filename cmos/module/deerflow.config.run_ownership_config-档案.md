# deerflow.config.run_ownership_config-档案

## 一、这个模块是干什么的

这个模块管理运行归属和租约的配置。

多worker部署时，一个worker崩溃了它正在跑的运行就成了孤儿。

这个配置让worker定期续租自己的活跃运行。

别的worker能检测出孤儿运行并接管。

租约续期默认关闭。

多worker部署需要显式开启。

## 二、模块里的主要成员

### 1、RunOwnershipConfig类

`lease_seconds`是租约过期秒数，默认30秒。

心跳每三分之一个租约周期续期一次。

`grace_seconds`是租约过期后再等多久才回收孤儿，默认10秒。

这个宽限同时是worker之间的时钟偏差预算。

`heartbeat_enabled`决定是否开启租约心跳，默认关闭。

多worker部署（GATEWAY_WORKERS大于1）必须开启。

### 2、时钟同步假设

文档详细说明了时钟偏差。

调和逻辑比较别的worker的租约过期时间和本机的当前时间。

唯一的偏差预算就是`grace_seconds`。

最坏情况是对方的时钟快了grace_seconds以上。

这时对方可能把还活着的运行误判成孤儿并回收。

运维要保证worker时钟同步，比如用NTP。

保证不了就调大`grace_seconds`。

代价是真正死掉的worker恢复变慢。

## 三、它和谁协作

`app_config.py`的`run_ownership`字段是这份配置。

这个字段是启动专用的。

RunManager在langgraph运行时启动时捕获这份配置。

租约心跳的后台任务也在那时创建。

## 四、重要性评级

评级：6分。

理由：孤儿运行检测是多worker部署的可靠性关键。时钟偏差预算的分析很完整。配置面小但语义重要。
