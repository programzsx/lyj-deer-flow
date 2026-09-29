# deerflow.guardrails.provider

## 一、这个模块是干什么的

这个模块定义守栏的提供者协议和数据结构。

背景是这样的。

工具调用执行前要授权。

授权逻辑由提供者实现。

中间件只负责接线和评估。

中间件和提供者之间要有约定。

约定就是这里的协议。

协议定义了请求长什么样。

定义了决策长什么样。

请求里带什么。

带工具名和工具输入。

带代理id、线程id、运行id。

带用户身份字段。

用户身份有多个来源。

有user_id、user_role、oauth_provider、oauth_id。

有channel_user_id。

有is_internal标记。

有authz_attributes。

身份字段由中间件从运行上下文填充。

默认值保证了不读这些字段的提供者向后兼容。

## 二、模块里的主要成员

- GuardrailProvider：协议。定义evaluate和aevaluate。
- GuardrailRequest：每次工具调用传给提供者的上下文。包含工具名、输入、代理和线程身份、用户身份、授权属性。
- GuardrailReason：允许或拒绝的结构化原因。包含code和message。是OAP reason对象。
- GuardrailDecision：评估决策。包含allow和reasons。
- 协议是runtime_checkable的。可以用isinstance检查。

## 三、它和谁协作

- 它被guardrails/middleware消费。中间件按协议调用提供者。
- 它被guardrails/builtin实现。内置提供者实现这个协议。
- 它被guardrails/typesafe实现。TypeSafe提供者也实现这个协议。

## 四、重要性评级

评级是3分。

理由是它是守栏机制的契约。

中间件和所有提供者靠这个协议协作。

身份字段的设计保证了向后兼容。

但它只有协议和数据定义，没有逻辑。

守栏功能默认关闭，使用面有限。
