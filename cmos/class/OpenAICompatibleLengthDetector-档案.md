# OpenAICompatibleLengthDetector档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/model_length_termination_detectors.py`

## 一、这个类是干什么的

OpenAICompatibleLengthDetector识别OpenAI系的长度截断信号。

判断条件是`finish_reason == "length"`。

这个约定覆盖一大批提供方。
凡是遵循OpenAI finish_reason惯例的适配器都算。
构造时可以用`finish_reasons`参数扩展识别的取值集合。

命中之后返回一条ModelLengthTermination记录。

## 二、类的成员

### （一）字段

- `name`：固定为`'openai_compatible_length'`。

### （二）方法

- `__init__`：可选传入自定义的finish_reason集合。
- `detect`：检查AIMessage的finish_reason。命中就返回ModelLengthTermination。

## 三、它和谁协作

- 它实现ModelLengthTerminationDetector接口。
- 它被ModelLengthFinishReasonMiddleware使用。

## 四、重要性评级

评级：5/10。

理由：OpenAI兼容系是DeerFlow覆盖面最大的提供方家族。输出超长截断是常见故障。这个检测器是长度护栏在主力提供方上的落点。它逻辑简单。所以给5分。