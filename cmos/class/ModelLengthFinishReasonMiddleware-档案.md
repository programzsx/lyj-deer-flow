# ModelLengthFinishReasonMiddleware档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/model_length_finish_reason_middleware.py`

## 一、这个类是干什么的

ModelLengthFinishReasonMiddleware处理提供方的输出超长响应并阻止截断的工具调用。

背景是这样的。

有些提供方在输出预算耗尽时停止生成。
通过`finish_reason='length'`表现出来。
停止时可能还返回了部分内容。

DeerFlow的处理策略是三条。

第一条是保留可见内容。部分回答照样给用户。

第二条是加确定性提示。工具调用被抑制的时候。即使部分文本存活也加提示。

第三条是丢弃在输出边界可能被截断的工具调用。不执行它们。

中间件还会盖一个`model_length_termination`标记。
下游守卫看到这个标记就不再行动。
比如TodoMiddleware看到标记就不再重新激活这一轮。
因为重新激活只会把同样超大的工具调用再打进同一个上限。

## 二、类的成员

### （一）字段

- `detectors`：一组ModelLengthTerminationDetector。按提供方识别长度截断信号。

### （二）方法

钩子方法是重点。

- `after_model`和`aafter_model`：模型响应之后用检测器找长度截断。命中就抑制工具调用。盖标记。返回状态更新。

辅助方法：

- `release_policy_parameters`：声明影响行为的配置。
- `_detect`：用检测器列表在消息上找长度截断。
- `_apply`：执行处理。返回状态更新。

## 三、它和谁协作

- 它挂在中间件链的模型响应之后位置。
- 它依赖四个长度检测器。OpenAICompatibleLengthDetector、AnthropicMaxTokensDetector、GeminiMaxTokensDetector。
- 它盖的`model_length_termination`标记被TodoMiddleware等下游守卫消费。
- 它和SafetyFinishReasonMiddleware对称。一个管安全终止。一个管长度终止。

## 四、重要性评级

评级：8/10。

理由：输出超长是高概率事件。长回答、长代码、长报告都可能撞上限。截断的tool_calls如果被执行会写坏文件。这个中间件同时保住了可见内容和线程健康。所以给8分。