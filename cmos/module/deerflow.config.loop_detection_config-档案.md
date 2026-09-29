# deerflow.config.loop_detection_config-档案

## 一、这个模块是干什么的

这个模块管理循环检测中间件的配置。

代理有时会陷入循环。

反复调用相同的工具组合。

或者对同一个工具调用太多次。

这两种循环都会烧令牌。

这个中间件检测这两种模式。

检测到就先警告，再强制停止。

## 二、模块里的主要成员

### 1、LoopDetectionConfig类

`enabled`是开关，默认开启。

`warn_threshold`是相同工具调用组合的警告阈值，默认3次。

`hard_limit`是强制停止的阈值，默认5次。

`window_size`是每线程追踪的最近调用组合数，默认20。

`max_tracked_threads`是内存里的线程历史上限。

`tool_freq_warn`和`tool_freq_hard_limit`是按工具类型的频率阈值。

默认30次警告、50次停止。

`tool_freq_overrides`是按工具的覆盖。

常见用法是给bash这类高频工具提高阈值。

比如RNA测序流程的批量工作流。

其他工具的保护不放松。

### 2、ToolFreqOverride类

这个类是一条按工具的频率覆盖。

`warn`和`hard_limit`两个字段。

校验器保证hard_limit不小于warn。

### 3、阈值校验

主类的校验器保证停止阈值不小于警告阈值。

两组阈值分别校验。

## 三、它和谁协作

`app_config.py`的`loop_detection`字段是这份配置。

循环检测中间件消费这份配置。

`tool_progress_config.py`是相似的中间件配置，但检测的是进度而不是重复。

## 四、重要性评级

评级：6分。

理由：循环检测是防止令牌浪费的常用保护。默认开启说明它是核心保护。按工具覆盖的设计让保护可以按工作流调整。
