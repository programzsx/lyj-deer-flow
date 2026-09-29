# deerflow.agents.middlewares.safety_termination_detectors档案

源码路径是backend/packages/harness/deerflow/agents/middlewares/safety_termination_detectors.py。

## 一、这个模块是干什么的

这个模块定义提供商安全终止信号的检测器。

不同的LLM提供商用不同的字段和不同的值表达"我因为安全原因停止了这次响应"。

这个模块定义一个小的策略接口。

这个模块定义三个内置检测器。

内置检测器覆盖DeerFlow今天支持的主要提供商。

新提供商可以随时加进来。

Wenxin、Hunyuan、Bedrock适配器、自研网关都属于新提供商。

加新提供商的方式是实现SafetyTerminationDetector接口。

再通过config.yaml的safety_finish_reason.detectors接线。

消费这些检测器的中间件在safety_finish_reason_middleware.py。

这个模块只负责检测。

不负责修复。

## 二、模块里的主要成员

### 1、SafetyTermination数据类

SafetyTermination是frozen数据类。

这个类表示一次检测到的安全终止信号。

字段有四个。

detector是产生这个结果的检测器名字。

名字用于可观测性。

操作员能看到哪条provider规则命中了。

reason_field是携带信号的元数据字段。

比如finish_reason。

比如stop_reason。

reason_value是那个字段的实际值。

比如content_filter。

比如refusal。

比如SAFETY。

extras是提供商特定的元数据。

Azure OpenAI的content_filter_results属于这类。

Gemini的safety_ratings属于这类。

检测器可以填充也可以跳过extras。

### 2、SafetyTerminationDetector协议

SafetyTerminationDetector是Protocol。

用了runtime_checkable装饰。

这是策略接口。

接口有一个name属性。

接口有一个detect方法。

detect接收AIMessage。

命中时返回SafetyTermination。

不命中时返回None。

实现必须无副作用。

实现必须容忍缺失的或类型古怪的元数据。

检测器在每次模型响应上运行。

### 3、_get_metadata_value助手

这个函数从response_metadata或additional_kwargs读字符串值。

LangChain的provider适配器对存放停止信号的位置不一致。

大多数现代适配器用response_metadata。

一些遗留或透传路径还在用additional_kwargs。

所以两个容器都检查。

检查顺序是response_metadata在前。

只接受字符串值。

Pydantic枚举或字典被忽略。

所以畸形输入不会抛异常。

### 4、OpenAICompatibleContentFilterDetector

这个检测器覆盖OpenAI兼容的content_filter信号。

覆盖的提供商有OpenAI、Azure OpenAI、Moonshot/Kimi、DeepSeek、Mistral、vLLM、Qwen。

任何遵循OpenAI finish_reason约定的适配器都覆盖。

默认值是content_filter。

一些中文提供商的自研OpenAI兼容网关用替代词。

替代词比如sensitive。

替代词比如violation。

可以通过finish_reasons参数扩展集合。

detect读finish_reason字段。

值小写后和集合比较。

Azure的content_filter_results块被带入extras。

这样操作员能看到什么被过滤了。

不用重新追踪。

### 5、AnthropicRefusalDetector

这个检测器覆盖Anthropic的stop_reason为refusal的信号。

Anthropic模型用专用的stop_reason表达安全拒绝。

不用finish_reason。

默认值是refusal。

detect读stop_reason字段。

值小写后和集合比较。

### 6、GeminiSafetyDetector

这个检测器覆盖Gemini和Vertex AI的安全终止。

Gemini用和OpenAI相同的finish_reason字段。

但Gemini用大写的枚举分类。

默认集合覆盖每一个表示"内容或图片触发了安全、黑名单、背诵或PII过滤"的finish_reason。

这些情况下同时返回的tool_calls很可能是截断的。

不可靠的。

默认集合包括文本安全的SAFETY、BLOCKLIST、PROHIBITED_CONTENT、SPII、RECITATION。

默认集合包括图片安全的IMAGE_SAFETY、IMAGE_PROHIBITED_CONTENT、IMAGE_RECITATION。

故意排除的项也有讲究。

STOP是正常终止。

MAX_TOKENS是输出长度截断。

不是安全问题。

#3028把它排除在外。

LANGUAGE和NO_IMAGE是能力不匹配。

和安全性无关。

MALFORMED_FUNCTION_CALL和UNEXPECTED_TOOL_CALL是工具调用协议错误。

这些情况下tool_calls也不可靠。

但失败类别和安全过滤不同。

要在专用检测器里处理。

这样可观测性记录才诚实。

OTHER、IMAGE_OTHER、FINISH_REASON_UNSPECIFIED太宽泛。

默认不启用。

提供商滥用这些值时可以用finish_reasons参数选择加入。

Gemini的safety_ratings被带入extras。

### 7、default_detectors函数

这个函数返回内置检测器集合。

没有配置自定义检测器时使用。

集合包含三个检测器。

OpenAICompatibleContentFilterDetector。

AnthropicRefusalDetector。

GeminiSafetyDetector。

## 三、它和谁协作

下游是safety_finish_reason_middleware。

中间件消费这里的检测器。

这个模块和中间件分离。

分离是策略接口的用法。

检测策略可以独立扩展和配置。

配置路径是safety_finish_reason.detectors。

自定义检测器通过reflection.resolve_variable加载。

上游依赖langchain_core.messages的AIMessage。

这个模块不依赖任何其他deerflow模块。

这个模块是叶子模块。

## 重要性评级

评级是6分。

理由如下。

这个模块是安全终止检测的策略层。

没有这个模块，中间件不知道各家提供商怎么表达安全停止。

三个内置检测器覆盖了主要提供商。

协议设计干净。

实现必须无副作用。

实现必须容忍畸形元数据。

这保证了检测器在每次响应上运行不出错。

故意排除项的推理写在文档里。

这让后续维护者知道为什么MAX_TOKENS不算安全终止。

所以评6分。

不评更高分的原因是这个模块本身不含行为逻辑。

真正的修复动作在safety_finish_reason_middleware里。

这个模块只是信号翻译层。

不评更低分的原因是它是安全终止能力的可扩展基础。

新增提供商必须有这个接口才能接入。
