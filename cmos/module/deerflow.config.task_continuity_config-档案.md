# deerflow.config.task_continuity_config-档案

## 一、这个模块是干什么的

这个模块管理任务连续性的配置。

任务连续性指线程本地的 Working notes。

还有一个压缩后的源回放。

这个功能是可选的。

默认关闭。

功能内容是给任务保留工作笔记和压缩的源记录。

## 二、模块里的主要成员

### 1、TaskContinuityConfig类

四个字段。

`enabled`是开关，默认关闭。

`max_batches`是最大批次记录数，默认32。

`max_records_per_batch`是每批次最大记录数，默认256。

`max_record_chars`是单条记录的最大字符数，默认16000。

三个数值字段都有上下限约束。

## 三、它和谁协作

`app_config.py`的`task_continuity`字段是这份配置。

任务连续性中间件消费这份配置。

## 四、重要性评级

评级：3分。

理由：任务连续性是可选的辅助功能，默认关闭。只有四个字段加边界约束。典型的薄配置模块。
