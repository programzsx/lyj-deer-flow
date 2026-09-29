# deerflow.config.tool_artifact_config-档案

## 一、这个模块是干什么的

这个模块管理工具产物句柄注册表的配置。

问题编号是issue #4676。

工具结果里可能有产物引用。

比如生成的文件路径。

上下文压缩时这些引用会丢失。

这个机制把产物引用捕获进线程状态。

引用在压缩中存活。

模型用短句柄（`art_xxxxxxxx`）引用产物。

工具调用时句柄被解析成真实引用。

## 二、模块里的主要成员

### 1、ToolArtifactConfig类

`enabled`是开关，默认开启。

`max_entries`是每线程保留的最大产物条目数，默认100。

`detect_refs_in_text`决定是否保守扫描自由文本。

扫描目标是沙箱路径和远程文件URL。

`inject_model_context`决定是否把可用句柄投影进模型请求。

作为持久上下文。

`resolve_handles_in_args`决定是否解析工具参数里的句柄。

解析发生在执行之前。

## 三、它和谁协作

`app_config.py`的`tool_artifacts`字段是这份配置。

工具产物中间件消费这份配置。

`ThreadState.tool_artifacts`是捕获目标的存储位置。

## 四、重要性评级

评级：6分。

理由：产物句柄解决上下文压缩后引用丢失的真实问题。默认开启说明它是核心路径。但配置面很小，主要是开关加三个行为开关。
