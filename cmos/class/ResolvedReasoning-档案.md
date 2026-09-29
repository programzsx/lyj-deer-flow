# ResolvedReasoning-档案.md

源文件位置。

这个类定义在`backend/packages/harness/deerflow/models/reasoning.py`。

## 一、这个类是干什么的

ResolvedReasoning是一个数据类。

这个类是"一次模型调用的最终生效推理策略"。

docstring原话是"The effective policy for one model call"。

意思是"一次模型调用的生效策略"。

先讲这个类在流程里的位置。

调用方发出一个"通用"推理请求。

请求包含两个值。

一个是`thinking_enabled`。

表示要不要开思维链。

一个是`reasoning_effort`。

表示要多深的推理强度。

通用请求不会直接发给服务商。

系统先拿模型的`ReasoningContract`。

契约描述这个模型真实的推理能力。

系统把通用请求"套进"契约里。

套完之后得到最终生效的值。

最终生效的值就装在ResolvedReasoning里。

模型工厂拿到ResolvedReasoning。

把生效值传给模型构造。

这样发给服务商的请求一定符合模型契约。

### `adjustments`字段的意义

docstring讲了`adjustments`的用途。

docstring说"``adjustments`` lists what the contract changed about the request so callers can log it"。

意思是"adjustments列出了契约对请求做了哪些修改，调用方可以据此记日志"。

这个字段记录所有"契约修正"。

修正发生的原因是调用方的请求和模型能力不匹配。

修正列表有五种取值。

取值一。`thinking_unsupported`。

调用方要开思维链。

但模型不支持。

系统关掉了思维链。

取值二。`thinking_forced_on`。

调用方要关思维链。

但模型强制开启。

系统把思维链强制打开了。

取值三。`effort_unsupported`。

调用方传了推理强度。

但模型不支持强度设置。

系统丢弃了强度值。

取值四。`effort_aliased`。

调用方传的强度是别名。

系统翻译成了模型认识的值。

取值五。`effort_unsupported_value`。

调用方传的强度值不在模型的取值范围里。

系统换成了默认值。

这些记录会进运行元数据。

运维人员看到日志就知道请求被修正过。

## 二、类的成员

这个类是`@dataclass(frozen=True)`装饰的不可变数据类。

### 字段`thinking_enabled`

类型是布尔值。

这是最终生效的"思维链开关"。

注意这个值可能和调用方请求的不一样。

三种情况会导致不一样。

情况一。模型不支持思维链。

请求开了也没用。生效值是False。

情况二。模型强制思维链。

请求关了也没用。生效值是True。

情况三。模型可选。生效值等于请求值。

### 字段`reasoning_effort`

类型是`str | None`。

这是最终生效的"推理强度值"。

这个值是服务商能接受的值。

四种情况。

情况一。模型不支持强度。生效值是None。

情况二。契约不严格。请求值原样转发。

情况三。请求值在允许范围里。生效值就是请求值。

情况四。其他情况。生效值是别名翻译结果或契约默认值。

### 字段`adjustments`

类型是字符串元组`tuple[str, ...]`。

默认是空元组。

这个字段记录契约对请求的全部修正。

五种取值前面已经讲过。

## 三、它和谁协作

### 被谁创建

`resolve_reasoning_request`函数创建ResolvedReasoning。

这个函数在同一个文件里。

函数输入是一个`ReasoningContract`。

加上调用方的`thinking_enabled`和`reasoning_effort`。

函数按契约逐项修正请求。

返回ResolvedReasoning。

### 被谁使用

模型工厂`create_chat_model`是主要消费方。

AGENTS.md的推理契约章节说明了使用方式。

`create_chat_model`是所有调用方的统一执行点。

调用方包括主agent、子agent、摘要生成、标题生成、一次性工具。

工厂解析出生效策略。

按生效值构建模型。

`ResolvedReasoning`还用于运行元数据。

AGENTS.md说"The lead agent and the subagent descriptor resolve the same policy first so run metadata reports the effective values"。

意思是"主agent和子agent描述器先解析同一个策略，这样运行元数据报告的是生效值"。

### 继承关系

这个类是纯dataclass。

这个类不继承任何业务类。

### 相关类型

上游是`ReasoningContract`。

契约是解析的输入。

冲突严重时抛出`ReasoningPolicyError`。

`keep_enabled`模式下不抛错。

修正被记进`adjustments`。

## 四、重要性评级

评级是5分。

理由如下。

第一点。

这个类是推理策略解析的输出载体。

生效值靠这个类传递给模型工厂。

第二点。

这个类是纯数据结构。

解析逻辑全在`resolve_reasoning_request`函数里。

这个类本身没有行为。

第三点。

这个类的价值在于`adjustments`的可观测性。

请求被契约修正过。

日志能如实报告。

排查问题时能分清"调用方要了什么"和"实际生效了什么"。

第四点。

如果删掉这个类。

`resolve_reasoning_request`没有返回类型。

工厂拿不到生效值。

修正记录也没地方装。

推理契约机制照样瓦解。

第五点。

这个类的使用面集中在reasoning.py和模型工厂。

外部模块不直接接触它。

依赖面窄。

综合以上。

这是一个中小型的支撑数据类。

机制里不可缺。

但独立地位不高。

评级5分。
