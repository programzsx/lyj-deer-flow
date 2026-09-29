# deerflow.config.subagent_batches_config-档案

## 一、这个模块是干什么的

这个模块管理原生子代理批次的配置。

批次是持久的原生子代理任务组。

一个批次里可以放很多条目。

系统调度执行，支持租约和恢复。

这个功能是启动专用的配置。

默认关闭。

## 二、模块里的主要成员

### 1、SubagentBatchesConfig类

`enabled`是开关，默认关闭。

`poll_interval_seconds`是轮询间隔，默认1秒。

`lease_seconds`是租约时长，默认120秒。

`max_items_per_batch`是每批最大条目数，默认5000。

`default_max_live_items`和`max_live_items_per_batch`是存活条目的默认上限和每批上限。

`default_max_running_items`和`max_running_items_per_batch`是运行条目的默认上限和每批上限。

`max_attempts`是条目的最大尝试次数，默认3次。

`max_result_chars`是结果的最大字符数，默认10万。

`result_preview_max_chars`是结果预览的最大字符数，默认2000。

### 2、限额一致性校验

校验器保证默认限额不超过对应的上限。

`default_max_live_items`不超过`max_live_items_per_batch`。

`default_max_running_items`不超过`max_running_items_per_batch`。

`default_max_running_items`不超过`default_max_live_items`。

`result_preview_max_chars`不超过`max_result_chars`。

## 三、它和谁协作

`app_config.py`的`subagent_batches`字段是这份配置。

这个字段是启动专用的。

持久化的子代理批次服务在生命周期启动时构造。

`subagent_runtime_config.py`管理同一批子代理的进程容量。

## 四、重要性评级

评级：5分。

理由：批次调度是原生子代理的扩展能力，默认关闭。限额一致性校验是这里的主要逻辑。默认限额与每批上限的区分是配置面的亮点。
