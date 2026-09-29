# _SafetyIntervention档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/safety_finish_reason_middleware.py`

## 一、这个类是干什么的

_SafetyIntervention是一次安全干预的准备结果。

SafetyFinishReasonMiddleware在模型响应上发现安全终止信号之后。
先准备一次干预。
干预的信息装进这个对象。
然后再统一应用。

这样检测和应用分开了。
准备阶段可以复杂。
应用阶段保持简单。

## 二、类的成员

### （一）字段

- `update`：要写回状态的更新字典。
- `termination`：检测到的SafetyTermination记录。
- `suppressed_names`：被抑制的工具名列表。
- `message`：被处理的AIMessage。
- `tool_calls`：被剥离的工具调用列表。

### （二）方法

_SafetyIntervention没有定义自己的方法。
它是一个纯数据容器。

## 三、它和谁协作

- SafetyFinishReasonMiddleware的`_prepare_intervention`产出它。
- SafetyFinishReasonMiddleware的`_apply`消费它并写回状态。

## 四、重要性评级

评级：3/10。

理由：_SafetyIntervention是中间件内部的中间数据。它让准备和应用两个阶段解耦。但它自身没有行为。所以分数偏低。