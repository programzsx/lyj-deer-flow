# TypeSafeGuardrailError-档案

## 一、这个类是干什么的

这个异常类表示一次TypeSafe评估无法产出可用裁决。

这个类继承自TypeSafeError。

这个类只属于工具门禁这个消费方。

当TypeSafe请求失败或答案不可用时，这个类被抛出。

Middleware捕获这个异常。

Middleware按guardrails.fail_closed配置决定拒绝还是放行。

这个类永远不会在provider内部被降级成允许。

这个类位于backend/packages/harness/deerflow/guardrails/typesafe.py。

## 二、类的成员（字段、方法，各自做什么）

这个类几乎没有自己的代码。

它继承TypeSafeError。

它继承的行为如下。

- message是错误消息。消息绝不包含凭证、请求状态或响应体内容。原因是恶意端点可能在响应里回显状态，而这些消息会进入Middleware日志、RunJournal和评估报告。
- cause是机器可读的错误类别字段。类别有四个。transport表示传输失败。http_status表示非200响应。invalid_response表示响应不是可用信封或答案不可用。deadline表示评估预算耗尽。

这个类存在的意义是类型标记。

Middleware看到这个类型就知道这是TypeSafe评估失败。

Middleware把它按fail_closed映射，而不是当成bug。

错误类别的透传规则如下。

请求级类别包括deadline、transport、http_status、invalid_response。这些原样透传。

问题级失败对本provider也报invalid_response。原因是这个provider只问一个问题。信封可用而答案不可用，同样等于没有裁决。

## 三、它和谁协作

- TypeSafeError是它的父类。
- TypeSafeGuardrailProvider在两种地方抛出它。一种是在请求级TypeSafeError发生时包装抛出。一种是在唯一答案的问题级失败时抛出。
- GuardrailMiddleware捕获它并按fail_closed处理。

## 四、重要性评级

评级是5分。

理由如下。

这个类让门禁失败有了明确的类型边界。

Middleware靠它区分"评估失败"和"代码bug"。

fail_closed语义依赖这个区分。

但它的实现几乎为零。

只是一个类型标记。

扣掉5分。
