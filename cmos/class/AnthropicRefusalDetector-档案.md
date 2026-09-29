# AnthropicRefusalDetector档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/safety_termination_detectors.py`

## 一、这个类是干什么的

AnthropicRefusalDetector识别Anthropic系的安全拒绝信号。

判断条件是`stop_reason == "refusal"`。

注意Anthropic用专门的`stop_reason`字段表达安全拒绝。
不用`finish_reason`。
这正是检测器分层的理由。

命中之后返回一条SafetyTermination记录。

## 二、类的成员

### （一）字段

- `name`：固定为`'anthropic_refusal'`。

### （二）方法

- `__init__`：可选传入自定义的stop_reason集合。
- `detect`：检查AIMessage的stop_reason。命中就返回SafetyTermination。

## 三、它和谁协作

- 它实现SafetyTerminationDetector接口。
- 它被SafetyFinishReasonMiddleware使用。

## 四、重要性评级

评级：5/10。

理由：Anthropic是主力提供方之一。refusal是Anthropic特有的字段。没有这个检测器Anthropic的安全拒绝会被当成普通响应。半截工具调用会漏出去。逻辑极简。所以给5分。