# ReasoningPolicyError-档案.md

源文件位置。

这个类定义在`backend/packages/harness/deerflow/models/reasoning.py`。

## 一、这个类是干什么的

ReasoningPolicyError是一个异常类。

这个类继承自Python内置的`ValueError`。

这个类的职责是表示"推理策略冲突"。

先讲背景。

DeerFlow里每个模型有一个"推理契约"。

推理契约描述这个模型怎么开思维链。

怎么传推理强度。

有的模型强制要求开思维链。

这种模型的`thinking`是`required`。

强制思维链的模型。

调用方不能请求关闭思维链。

如果调用方非要关。

这就产生了冲突。

冲突发生时。

系统抛出ReasoningPolicyError。

这个类的docstring写明了含义。

docstring说"A request contradicts the model's reasoning contract and must not reach the provider"。

意思是"请求与模型的推理契约矛盾，这样的请求绝不能到达服务商"。

这句话强调一个重点。

这个错误是一个"拦截"信号。

矛盾请求在本地就被拦下。

请求根本不会发给大模型服务商。

什么场景会抛这个错误。

模型工厂`create_chat_model`是所有模型调用的统一入口。

工厂在构建模型前先解析推理策略。

先讲具体的冲突场景。

场景是模型要求强制思维链。

模型的契约是`thinking: required`。

契约同时配置了`on_disable_request: reject`。

调用方请求关闭思维链。

也就是`thinking_enabled=False`。

这时候抛出ReasoningPolicyError。

还有另一种处理方式。

契约配置的是`on_disable_request: keep_enabled`。

这时候不抛错。

系统悄悄把思维链重新打开。

请求照常发出。

只有选择`reject`的模型才抛这个错。

## 二、类的成员

这个类没有任何自定义成员。

这个类没有定义字段。

这个类没有定义方法。

这个类只是继承`ValueError`。

然后挂上专属类名和docstring。

### 为什么单独建类

`ValueError`太宽泛。

值校验错误都算ValueError。

调用方需要精确识别"推理策略冲突"。

有了专属类型。

调用方可以写`except ReasoningPolicyError`。

针对这类错误给出专门的提示。

比如提示用户"这个模型必须开思维链，请在配置里开启"。

### 抛出位置

抛出点是`resolve_reasoning_request`函数。

这个函数也在同一个文件里。

抛出消息是"model requires thinking, but the request asked for it to be disabled"。

消息意思是"模型要求思维链，但请求要求关闭思维链"。

## 三、它和谁协作

### 继承关系

ReasoningPolicyError继承自`ValueError`。

`ValueError`是Python内置异常。

### 谁抛出这个类

同一个文件里的`resolve_reasoning_request`函数抛出这个类。

这个函数是推理请求解析的唯一策略执行点。

### 谁触发解析

模型工厂`create_chat_model`调用`resolve_reasoning_request`。

工厂是所有调用方（主agent、子agent、摘要、标题生成、一次性工具）的统一执行点。

所以所有模型调用路径都可能遇到这个异常。

### 相关类型

这个类和reasoning.py里的其他类型配套使用。

相关的类型有`ReasoningContract`、`EffortContract`、`ResolvedReasoning`。

契约由`ReasoningContract`描述。

策略解析结果由`ResolvedReasoning`描述。

策略冲突时抛出`ReasoningPolicyError`。

## 四、重要性评级

评级是4分。

理由如下。

第一点。

这个类本身不承载逻辑。

这个类只是一个异常标记。

代码量接近零。

第二点。

这个类是推理契约安全机制的一环。

强制思维链的模型如果收到关闭请求。

服务商可能直接拒绝。

或者产生不符合预期的行为。

本地拦截能给出更清晰的报错。

第三点。

这个类的触发条件比较窄。

触发需要三个条件同时满足。

模型契约是`required`。

契约配置了`on_disable_request: reject`。

调用方请求关闭思维链。

大多数模型是`optional`。

所以这个异常在日常运行里很少出现。

第四点。

这个类不可删除。

`resolve_reasoning_request`直接引用这个类。

删掉它。

`reject`语义就没有载体了。

矛盾请求会静默通过。

最终由服务商报出难懂的错误。

综合以上。

这是一个触发频率低但语义必要的异常类。

评级4分。
