# ModelLengthTermination档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/model_length_termination_detectors.py`

## 一、这个类是干什么的

ModelLengthTermination表示检测到了一次模型输出长度截断。

不同提供方报告"输出撞到token上限"的方式不一样。
检测器识别出来之后，把结果装进这个对象。

下游的ModelLengthFinishReasonMiddleware消费这个对象。
它不需要关心是哪家提供方、哪个字段报的。

## 二、类的成员

### （一）字段

- `detector`：产生这个结果的检测器名字。
- `reason_field`：携带信号的消息元数据字段名。比如`finish_reason`或`stop_reason`。
- `reason_value`：那个字段的实际值。比如`length`或`max_tokens`。
- `extras`：提供方专属的附加信息。可选。

### （二）方法

ModelLengthTermination没有定义自己的方法。
它是一个纯数据记录。

## 三、它和谁协作

- 四个长度检测器产出它。包括OpenAICompatibleLengthDetector、AnthropicMaxTokensDetector、GeminiMaxTokensDetector。
- ModelLengthFinishReasonMiddleware的`_detect`方法消费它。

## 四、重要性评级

评级：3/10。

理由：ModelLengthTermination是长度截断信号的标准化载体。它让中间件与提供方细节解耦。但它是纯数据类。逻辑都在检测器和中间件里。所以分数偏低。