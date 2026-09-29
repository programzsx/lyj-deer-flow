# deerflow.runtime.stream_modes 档案

## 一、这个模块是干什么的

这个模块定义"运行支持哪些流模式"。

LangGraph的运行可以按不同的模式往外流数据。

DeerFlow支持七种。values、messages-tuple、updates、debug、tasks、checkpoints、custom。

这个模块做三件事。

声明支持的模式集合。

校验调用者请求的模式。不支持的报错。

把公开的模式名映射到langgraph内部的模式名。

核心原则是一句话。映射失败不静默兜底。不支持就是不支持。报错。

## 二、模块里的主要成员

- `RunStreamMode`。类型别名。用`Literal`列出七种支持的公开模式。

- `SUPPORTED_RUN_STREAM_MODES`。从类型别名提取出的frozenset。模式集合的运行时事实来源。

- `UnsupportedStreamModeError`。调用者请求了DeerFlow不能支持的模式时抛出。错误信息列出所有不支持的模式。去重。

- `normalize_stream_modes(raw)`。规范化并校验公开模式。None默认`["values"]`。字符串转单元素列表。空列表默认`["values"]`。非字符串元素和支持集合之外的都报错。

- `to_langgraph_stream_modes(raw)`。把公开模式映射到`graph.astream`的模式。`messages-tuple`映射成`messages`。其他不变。先走normalize校验。再去重。没有静默兜底。

## 三、它和谁协作

它只依赖typing。

它的消费者是LangGraph兼容的运行时边界。Gateway和embedded runtime的流式入口用它校验请求。

调用方传来的stream_mode参数经过它规范化。再传给langgraph的astream。

## 四、重要性评级

评级是4分。

理由如下。

它是运行时流式边界的校验入口。47行。小而清晰。

"不静默兜底"这个原则在这里落实。调用者请求不存在的模式会得到明确的错误。不会拿到意外的行为。

模式集合是类型驱动的事实来源。加新模式只需要改一处。

扣分原因。它是薄薄的一层校验和映射。没有业务逻辑。没有状态。出错场景明确且少见。
