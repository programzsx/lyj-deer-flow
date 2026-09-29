# deerflow.config.tool_progress_config-档案

## 一、这个模块是干什么的

这个模块管理工具进度追踪中间件的配置。

代理执行任务时可能连续调用工具失败。

失败调用堆积，任务就卡住了。

这个中间件追踪每个任务的工具调用进度。

发现问题连续出现就注入警告提示。

警告继续失败就升级为阻止。

## 二、模块里的主要成员

### 1、ToolProgressConfig类

`enabled`是开关，默认关闭。

`stagnation_threshold`是连续问题调用次数，达到就注入警告，默认3次。

`warn_escalation_count`是警告后再失败的次数，达到就升级为阻止，默认2次。

`inject_assessment`决定是否把进度评估提示注入模型请求。

`jaccard_similarity_threshold`是近似重复结果检测的Jaccard相似度阈值，默认0.8。

`min_word_count_for_similarity`是应用Jaccard检查的最小词数。

太短的内容完全跳过近似重复检测。

`exempt_tools`是排除在追踪外的工具。

默认排除澄清提问、待办、文件展示、任务工具。

`max_tracked_threads`是内存里保留的线程历史上限，LRU淘汰。

## 三、它和谁协作

`app_config.py`的`tool_progress`字段是这份配置。

工具进度中间件消费这份配置。

`loop_detection_config.py`处理类似的重复检测，模式相似。

## 四、重要性评级

评级：5分。

理由：进度追踪是任务质量的辅助机制。默认关闭说明它是可选能力。状态机逻辑（正常、警告、阻止）在中间件里，这里只是配置。
