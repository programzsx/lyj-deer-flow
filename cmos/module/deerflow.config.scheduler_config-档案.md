# deerflow.config.scheduler_config-档案

## 一、这个模块是干什么的

这个模块管理计划任务运行时的配置。

DeerFlow支持计划任务。

任务可以是一次性、cron或间隔模式。

后台轮询器到点后启动代理运行。

这个配置控制轮询器怎么工作。

配置写在`config.yaml`的`scheduler:`下。

## 二、模块里的主要成员

### 1、SchedulerConfig类

`enabled`是开关，默认关闭。

`multi_instance`声明是否多实例部署。

多实例需要共享的恢复前提。

`poll_interval_seconds`是轮询间隔，默认5秒。

`lease_seconds`是任务租约时长，默认120秒。

`max_concurrent_runs`是最大并发运行数，默认3。

`queue_timeout_seconds`是队列超时，默认3600秒。

`min_once_delay_seconds`是一次性任务的最小延迟，默认60秒。

### 2、recursion_limit

这个字段是计划任务启动的运行用的LangGraph递归上限。

默认1000。

和web UI的交互预算一致。

这样计划运行和交互运行开箱即用时行为一致。

这个字段在派发时读取。

不捕获进任务服务。

原因是config.yaml改了这个值，下一次计划运行就生效。

超过AppConfig的`max_recursion_limit`的值会被钳制。

## 三、它和谁协作

`app_config.py`的`scheduler`字段是这份配置。

这个字段是启动专用的。

计划任务服务在网关生命周期启动时构造并启动。

配置值被捕获进服务实例。

后台轮询任务不会因config.yaml编辑而重建。

`recursion_limit`是例外，每次派发时重新读取。

## 四、重要性评级

评级：6分。

理由：计划任务是产品的自动化能力。recursion_limit的读取时机设计（派发时读而非捕获）是热重载边界的典型例子。多实例语义在这里声明。
