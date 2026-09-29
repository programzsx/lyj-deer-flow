# GeminiSafetyDetector档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/safety_termination_detectors.py`

## 一、这个类是干什么的

GeminiSafetyDetector识别Gemini和Vertex AI的安全相关终止信号。

Gemini用和OpenAI相同的`finish_reason`字段。
但取值是大写枚举分类法。

默认集合覆盖所有Gemini里表示"内容或图片触发了安全、黑名单、背诵或PII过滤器"的取值。
这些情况下一起返回的tool_calls大概率被截断或不可靠。

默认集合是八个值。
SAFETY、BLOCKLIST、PROHIBITED_CONTENT、SPII、RECITATION、IMAGE_SAFETY、IMAGE_PROHIBITED_CONTENT、IMAGE_RECITATION。

有几类被故意排除在默认集合外。

STOP是正常终止。不算。

MAX_TOKENS是长度截断。不是安全。由长度检测器管。

LANGUAGE和NO_IMAGE是能力不匹配。和安全性无关。

MALFORMED_FUNCTION_CALL和UNEXPECTED_TOOL_CALL是工具调用协议错误。tool_calls同样不可靠。但失败类别和安全过滤不同。放到专门的检测器里。让观测记录诚实。

OTHER和IMAGE_OTHER太宽泛。默认不开。需要时通过`finish_reasons`参数自行打开。

命中之后返回一条SafetyTermination记录。

## 二、类的成员

### （一）字段

- `name`：固定为`'gemini_safety'`。
- `_DEFAULT_FINISH_REASONS`：默认的八个finish_reason取值。

### （二）方法

- `__init__`：可选传入自定义的finish_reason集合。
- `detect`：检查AIMessage的finish_reason。命中就返回SafetyTermination。

## 三、它和谁协作

- 它实现SafetyTerminationDetector接口。
- 它被SafetyFinishReasonMiddleware使用。

## 四、重要性评级

评级：5/10。

理由：Gemini的大写枚举分类法差异全靠它吸收。默认集合的取舍有明确理由。排除项的归属也很清楚。逻辑极简但分类学价值实在。所以给5分。