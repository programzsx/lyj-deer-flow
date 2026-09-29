# SafetyTermination档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/safety_termination_detectors.py`

## 一、这个类是干什么的

SafetyTermination表示检测到的一次安全终止信号。

提供方在因为安全原因停止响应时。
会用各自的字段和取值表达。
检测器识别出来之后把结果装进这个对象。

下游的SafetyFinishReasonMiddleware消费这个对象。
中间件不需要关心是哪家提供方、哪个字段、哪个取值。

## 二、类的成员

### （一）字段

- `detector`：产生这个结果的检测器名字。用于观测。操作员能看出是哪条提供方规则命中的。
- `reason_field`：携带信号的消息元数据字段名。比如`finish_reason`或`stop_reason`。
- `reason_value`：那个字段的实际值。比如`content_filter`、`refusal`、`SAFETY`。
- `extras`：提供方专属的元数据。比如Azure的content_filter_results。Gemini的safety_ratings。检测器可选填。

### （二）方法

SafetyTermination没有定义自己的方法。
它是一个纯数据记录。

## 三、它和谁协作

- 三个安全检测器产出它。OpenAICompatibleContentFilterDetector、AnthropicRefusalDetector、GeminiSafetyDetector。
- SafetyFinishReasonMiddleware的`_detect`方法消费它。

## 四、重要性评级

评级：4/10。

理由：SafetyTermination是安全终止信号的标准化载体。它让中间件与提供方细节解耦。它携带的extras让Azure和Gemini的过滤详情可追溯。它是纯数据类。所以给4分。