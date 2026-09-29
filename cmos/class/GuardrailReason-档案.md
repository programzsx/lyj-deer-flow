# GuardrailReason-档案

## 一、这个类是干什么的

这个数据类是门禁决定理由的结构化对象。

这个类说明一次工具调用为什么被允许或被拒绝。

这个类和OAP标准的reason对象对齐。

每个GuardrailDecision都携带一个或多个这个对象。

这个类位于backend/packages/harness/deerflow/guardrails/provider.py。

## 二、类的成员（字段、方法，各自做什么）

这个类是纯数据类，没有方法。

字段如下。

- code是机器可读的原因代码字符串。例如"oap.tool_not_allowed"表示工具不在允许名单。例如"oap.allowed"表示正常放行。例如"oap.evaluator_error"表示提供者自己出错。例如"typesafe.tool_call_risky"表示TypeSafe判定调用有风险。
- message是人类可读的说明字符串。默认值是空字符串。拒绝时这条消息会进入ToolMessage错误内容。RunJournal记录时会把这条消息截断到500字符。

## 三、它和谁协作

- GuardrailDecision持有这个对象。每个决定用reasons列表携带它。
- GuardrailMiddleware读取它。Middleware取第一条理由的code和message拼进拒绝消息。Middleware还把所有code收集进AuthorizationOutcome。
- RunJournal通过Middleware记录它。记录时message被截断到_REASON_MESSAGE_LIMIT。

## 四、重要性评级

评级是6分。

理由如下。

这个类让门禁决定变得可解释。

code让程序可以分类处理。

message让用户和审计可以理解原因。

但它只有两个字段。

没有任何行为。

结构非常简单。

扣掉4分。
