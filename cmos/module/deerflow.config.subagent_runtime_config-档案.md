# deerflow.config.subagent_runtime_config-档案

## 一、这个模块是干什么的

这个模块管理原生子代理的进程容量配置。

原生子代理在一个网关进程里执行。

每个进程的执行槽是有限的。

这个配置声明进程级的准入和执行限制。

所有子代理共享这些限制。

配置写在`config.yaml`的`subagent_runtime:`下。

## 二、模块里的主要成员

### 1、SubagentRuntimeConfig类

`max_running`是同一网关进程里可并发执行的原生子代理上限，默认3。

`max_queued`是等待执行槽位的子代理上限，默认64。

`admission_policy`选择池满时的行为。

`queue`排队等待。

`reject`立即拒绝。

`queue_timeout_seconds`是排队的最大等待，默认300秒。

超时后子代理准入失败。

## 三、它和谁协作

`app_config.py`的`subagent_runtime`字段是这份配置。

这个字段是启动专用的。

共享的子代理准入控制器和隔离执行循环在生命周期启动时配置。

`subagents_config.py`的并发解析函数读取这里的`max_running`。

## 四、重要性评级

评级：6分。

理由：进程容量限制是多子代理并发的关键保护。准入策略的选择决定过载时的行为。排队超时防止无限等待。
