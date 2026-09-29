# OpenAICompatibleContentFilterDetector档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/safety_termination_detectors.py`

## 一、这个类是干什么的

OpenAICompatibleContentFilterDetector识别OpenAI系的内容过滤信号。

判断条件是`finish_reason == "content_filter"`。

这个约定覆盖一大批提供方。
OpenAI、Azure OpenAI、Moonshot、DeepSeek、Mistral、vLLM、Qwen的OpenAI兼容模式都算。

有些中国提供方的OpenAI兼容网关用别的词。
比如`sensitive`或`violation`。
构造时用`finish_reasons`参数扩展识别集合。

命中之后返回一条SafetyTermination记录。

## 二、类的成员

### （一）字段

- `name`：固定为`'openai_compatible_content_filter'`。

### （二）方法

- `__init__`：可选传入自定义的finish_reason集合。
- `detect`：检查AIMessage的finish_reason。命中就返回SafetyTermination。

## 三、它和谁协作

- 它实现SafetyTerminationDetector接口。
- 它被SafetyFinishReasonMiddleware使用。

## 四、重要性评级

评级：5/10。

理由：OpenAI兼容系覆盖面最大。内容过滤在受限内容场景会真实出现。过滤后带出的半截工具调用会造成执行事故。这个检测器是安全护栏在主力提供方上的落点。逻辑简单。所以给5分。