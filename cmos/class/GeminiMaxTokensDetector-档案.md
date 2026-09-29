# GeminiMaxTokensDetector档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/model_length_termination_detectors.py`

## 一、这个类是干什么的

GeminiMaxTokensDetector识别Gemini和Vertex AI的长度截断信号。

判断条件是`finish_reason == "MAX_TOKENS"`。

注意Gemini的取值是全大写枚举。
和OpenAI的小写`length`不同。

命中之后返回一条ModelLengthTermination记录。

## 二、类的成员

### （一）字段

- `name`：固定为`'gemini_max_tokens'`。

### （二）方法

- `__init__`：可选传入自定义的finish_reason集合。
- `detect`：检查AIMessage的finish_reason。命中就返回ModelLengthTermination。

## 三、它和谁协作

- 它实现ModelLengthTerminationDetector接口。
- 它被ModelLengthFinishReasonMiddleware使用。

## 四、重要性评级

评级：5/10。

理由：Gemini和Vertex AI是支持矩阵里的提供方。大写枚举的差异由它吸收。检测器本身逻辑极简。所以给5分。