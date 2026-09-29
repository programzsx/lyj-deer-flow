# AnthropicMaxTokensDetector档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/model_length_termination_detectors.py`

## 一、这个类是干什么的

AnthropicMaxTokensDetector识别Anthropic系的长度截断信号。

判断条件是`stop_reason == "max_tokens"`。

注意Anthropic用的是`stop_reason`字段。
不是OpenAI的`finish_reason`。
这正是检测器分层存在的理由。

命中之后返回一条ModelLengthTermination记录。

## 二、类的成员

### （一）字段

- `name`：固定为`'anthropic_max_tokens'`。

### （二）方法

- `__init__`：可选传入自定义的stop_reason集合。
- `detect`：检查AIMessage的stop_reason。命中就返回ModelLengthTermination。

## 三、它和谁协作

- 它实现ModelLengthTerminationDetector接口。
- 它被ModelLengthFinishReasonMiddleware使用。

## 四、重要性评级

评级：5/10。

理由：Anthropic是主力提供方之一。max_tokens截断是真实高频场景。检测器本身逻辑极简。所以给5分。