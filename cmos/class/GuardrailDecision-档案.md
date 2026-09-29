# GuardrailDecision-档案

## 一、这个类是干什么的

这个数据类是工具授权门禁的裁决对象。

这个类表示一个GuardrailProvider对一次工具调用的判断结果。

判断结果只有两种。

一种allow是允许。

一种deny是拒绝。

这个类和OAP标准的Decision对象对齐。

这个类位于backend/packages/harness/deerflow/guardrails/provider.py。

## 二、类的成员（字段、方法，各自做什么）

这个类是纯数据类，没有方法。

字段如下。

- allow是布尔值。allow为True表示允许工具执行。allow为False表示拒绝工具执行。
- reasons是GuardrailReason对象的列表。这个列表说明为什么允许或拒绝。拒绝时这个列表至少有一条理由。
- policy_id是可选字段。这个字段表示做出决定的策略标识。默认值是None。为None时由Middleware用提供者的自身标识补上。
- metadata是附加元数据字典。默认值是空字典。TypeSafe提供者会在这里放probability、threshold、model等字段。

## 三、它和谁协作

- GuardrailProvider生产这个对象。每个提供者的evaluate和aevaluate都返回它。
- GuardrailMiddleware消费这个对象。Middleware根据allow字段决定放行还是返回错误ToolMessage。
- AuthorizationOutcome由Middleware从这个对象构造。构造后的结果写入运行时上下文，供外部审计。
- RunJournal记录这个对象的决定。记录通过GuardrailMiddleware的_record_guardrail_event完成。

## 四、重要性评级

评级是7分。

理由如下。

这个类是门禁决定的标准出口。

所有提供者的判断都通过它传达给Middleware。

allow字段直接决定工具是否执行。

理由列表直接进入错误消息和审计记录。

但它是纯数据类。

没有逻辑。

扣掉3分。
