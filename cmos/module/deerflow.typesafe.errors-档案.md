# deerflow.typesafe.errors

## 一、这个模块是干什么的

这个模块定义TypeSafe的唯一错误分类。

背景是这样的。

TypeSafe请求可能失败。

失败要分类。

每个消费方都要把失败映射成自己的策略。

如果每家自己分类，分类就不一致。

所以错误分类收敛在这里。

它分两层。

第一层是请求级失败。

失败原因是传输错误、截止时间用完、非200状态、响应没有可用信封。

这些抛TypeSafeError。

TypeSafeError带一个机器可读的cause。

cause有四种取值。

transport表示请求没到达可用响应。

http_status表示端点回答了但不是200。

invalid_response表示端点回答了200但body不是可用信封。

deadline表示预算在可用结果之前花完了。

第二层是问题级失败。

答案是缺失的、类型错的、概率非有限或超范围、标签未知。

这些从不抛异常。

它们作为数据回到AnswerSet.errors_by_question里。

一个坏问题不能丢掉其他好答案。

cause对执行意味着什么由消费方决定。

工具门变成拒绝。

记忆路径回退到正常行为。

错误消息永远不含凭据、请求状态、响应体。

## 二、模块里的主要成员

- TypeSafeError：请求级失败的异常。是RuntimeError的子类。带cause字段。
- CAUSE_TRANSPORT：传输失败的原因常量。
- CAUSE_HTTP_STATUS：非200状态的原因常量。
- CAUSE_INVALID_RESPONSE：响应不可用的原因常量。
- CAUSE_DEADLINE：预算用完的原因常量。
- CAUSES：四种原因的集合。

## 三、它和谁协作

- 它被typesafe/client抛出。
- 它被guardrails/typesafe消费。工具门把错误翻译成拒绝。
- 它被agents/memory下的消费方使用。记忆路径把错误翻译成回退。

## 四、重要性评级

评级是5分。

理由是它是TypeSafe失败语义的唯一词汇表。

两层分离的设计保证一个坏答案不丢掉好答案。

cause是机器可读的，消费方的策略映射靠它。

错误消息不回显凭据和响应体是安全设计。

但它只是分类定义，体量很小。
