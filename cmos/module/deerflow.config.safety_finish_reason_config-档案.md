# deerflow.config.safety_finish_reason_config-档案

## 一、这个模块是干什么的

这个模块管理安全终止原因中间件的配置。

有的模型提供者会因为安全原因截断输出。

比如OpenAI的`finish_reason='content_filter'`。

危险在于截断可能发生在工具调用的中途。

半截的参数如果被执行，后果不可预测。

这个中间件拦截这类消息，抑制其中的工具调用。

让半截的参数永远不执行。

## 二、模块里的主要成员

### 1、SafetyFinishReasonConfig类

`enabled`是总开关，默认开启。

`detectors`是自定义检测器列表。

留空时使用内置检测器集合。

内置集合覆盖OpenAI的内容过滤、Anthropic的拒绝、Gemini的各类安全终止。

提供非空列表就完全覆盖内置集合。

### 2、SafetyDetectorConfig类

这个类是一个检测器条目。

`use`是检测器实现的类路径。

`config`是传给检测器类的构造参数。

检测器通过`deerflow.reflection.resolve_variable`按类路径加载。

和guardrails的`provider`配置用同一个加载器。

用户可以投放自定义检测器，不用改核心代码。

## 三、它和谁协作

`app_config.py`的`safety_finish_reason`字段是这份配置。

`safety_finish_reason`不是启动专用字段，属于可热重载的配置。

中间件实现消费检测器列表。

## 四、重要性评级

评级：6分。

理由：这个中间件防御的是安全截断导致的半截工具调用执行。这是一个真实但低频的威胁。配置模型本身很小，可插拔检测器的设计是亮点。
