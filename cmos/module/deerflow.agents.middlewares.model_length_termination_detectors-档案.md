# deerflow.agents.middlewares.model_length_termination_detectors档案

源码路径是backend/packages/harness/deerflow/agents/middlewares/model_length_termination_detectors.py。

## 一、这个模块是干什么的

这个模块负责识别provider侧的输出长度截断信号。

不同的provider用不同的字段和值表达"响应撞到了输出token上限"。

OpenAI用finish_reason='length'。

Anthropic用stop_reason='max_tokens'。

Gemini用finish_reason='MAX_TOKENS'。

这个模块的存在目的是把provider的细节集中在这里。

ModelLengthFinishReasonMiddleware负责决定何时标记一次运行。

各provider用哪种写法表达截断归这个模块管。

职责分离之后，中间件只关心"是否截断"，不关心"哪个provider怎么写"。

## 二、模块里的主要成员

### 1、ModelLengthTermination数据类

这是检测命中结果的结构体。

frozen dataclass，不可变。

包含三个字段。

detector是检测器名。

reason_field是原因字段名。

reason_value是原因字段值。

extras是附加信息，默认空字典。

### 2、ModelLengthTerminationDetector协议

这是检测器的策略接口。

用@runtime_checkable装饰的Protocol。

接口有一个name属性。

接口有一个detect方法。

方法接收AIMessage。

命中截断时返回ModelLengthTermination。

未命中时返回None。

### 3、_get_metadata_value辅助函数

这个函数从LangChain常见的provider字段读取字符串元数据值。

它检查两个容器。

第一个是response_metadata。

第二个是additional_kwargs。

容器不是字典时跳过。

值是字符串且非空时返回。

### 4、OpenAICompatibleLengthDetector类

这是OpenAI兼容provider的检测器。

检测finish_reason=='length'信号。

name是openai_compatible_length。

构造参数finish_reasons可以自定义。

默认是('length',)。

配置值统一转小写存入frozenset。

detect方法从元数据读finish_reason。

值在配置的集合里就返回命中。

### 5、AnthropicMaxTokensDetector类

这是Anthropic的检测器。

检测stop_reason=='max_tokens'信号。

name是anthropic_max_tokens。

构造参数stop_reasons可以自定义。

默认是('max_tokens',)。

配置值统一转小写。

detect方法从元数据读stop_reason。

### 6、GeminiMaxTokensDetector类

这是Gemini和Vertex AI的检测器。

检测finish_reason=='MAX_TOKENS'信号。

name是gemini_max_tokens。

注意Gemini的值是大写。

配置值统一转大写。

detect方法从元数据读finish_reason。

### 7、default_detectors函数

这个函数返回内置检测器集。

包含三个检测器。

OpenAICompatibleLengthDetector。

AnthropicMaxTokensDetector。

GeminiMaxTokensDetector。

ModelLengthFinishReasonMiddleware不传检测器时用这个集合。

## 三、它和谁协作

这个模块是纯检测器模块，不是中间件。

它只有一个主要消费者，就是ModelLengthFinishReasonMiddleware。

中间件在after_model里调用检测器的detect方法。

中间件用命中的结果打model_length_termination标记。

这个模块依赖langchain_core.messages的AIMessage。

它只读消息，不修改消息。

它不依赖配置系统。

自定义检测器可以实现同一个协议接入。

## 重要性评级

评级是5分。

理由如下。

这个模块职责单一，把provider细节集中在一处。

三个内置检测器覆盖了三大主流provider。

策略接口让新provider接入变成一个类的实现。

它让中间件保持简洁，专注处理逻辑。

所以评级是5分。

不评更高分的理由是它没有独立行为。

它只是被动的检测函数集合。

命中结果只是给中间件用的中间数据。

也不评低分，因为provider拼写集中管理避免了拼写散落各处的问题。

写错一个拼写会漏掉一种provider的截断信号。
