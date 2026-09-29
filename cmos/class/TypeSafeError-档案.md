# TypeSafeError-档案

## 一、这个类是干什么的

这个异常类是TypeSafe（Jev）所有消费方统一的错误分类出口。

这个类表示一次TypeSafe请求无法产出可用答案集。

这个类只为请求级失败而抛出。

问题级失败不抛这个类。

问题级失败作为数据返回。

这个类位于backend/packages/harness/deerflow/typesafe/errors.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、TypeSafeError异常类

这个类继承自RuntimeError。

构造时接受message和cause。

- message是错误消息。消息绝不包含凭证、请求状态或响应体。原因是恶意或坏掉的端点可能把状态回显回来，而这些消息会进入Middleware日志、RunJournal和评估报告。
- cause是机器可读的类别字段。

### 2、四个cause常量

- CAUSE_TRANSPORT的值是"transport"。表示请求没有到达可用响应。原因包括DNS失败、连接失败、读取失败、协议错误。
- CAUSE_HTTP_STATUS的值是"http_status"。表示端点回答了但不是200。
- CAUSE_INVALID_RESPONSE的值是"invalid_response"。表示端点回答了200但响应体不是可用信封。
- CAUSE_DEADLINE的值是"deadline"。表示评估预算在可用结果出现之前耗尽。

CAUSES集合汇总这四个常量。

### 3、两层错误设计

这个模块的文档明确说明两层是刻意分开的。

请求级失败抛TypeSafeError。

消费方决定拒绝还是继续。

问题级失败是数据。

问题级失败在AnswerSet.errors_by_question里返回。

一条坏问题不会丢弃同响应里的其他好答案。

cause的含义由消费方决定。

工具门禁把错误转成拒绝。

memory路径把错误转成正常回退。

## 三、它和谁协作

- TypeSafeClient在所有请求级失败时抛出它。
- TypeSafeGuardrailError继承它，作为门禁消费方的类型标记。
- 各消费方根据cause字段决定自己的失败策略。

## 四、重要性评级

评级是6分。

理由如下。

这个类是TypeSafe错误的统一分类。

cause字段让每个消费方都能按类别决策。

错误消息的保密约束直接影响安全。

两层错误设计让坏答案不拖累好答案。

但它的实现很小。

一个异常类加四个常量。

扣掉4分。
