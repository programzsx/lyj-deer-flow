# QuestionError-档案

## 一、这个类是干什么的

QuestionError是typesafe/client.py里的冻结数据类。

它表示问题级失败。

请求是可用的。这个问题的answer不可用。

这个类位于backend/packages/harness/deerflow/typesafe/client.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、字段

question_id是问题id。

category是失败类别。missing、type、probability、label之一。

message是问题描述。

### 2、message不echo响应body

message命名问题。不重复响应body。

恶意的或敌对的端点会用echo的状态填满body。

### 3、类别语义

missing是响应没有这个问题的answer。

type是answer不是对象或type不匹配。

probability是noul概率不是数字或超出[0, 1]。

label是choice标签不是文本或不在criteria里。

### 4、在AnswerSet里的位置

errors_by_question持有QuestionError。

调用者用noul()取answer。失败的问题返回None。

## 三、它和谁协作

- AnswerSet的errors_by_question持有它。
- _validate_answer系列构建它。
- 消费者如guardrails读取它决定fallback。

## 四、重要性评级

评级是5分。

理由如下。

这个类是问题级失败的载体。

问题失败是数据不是异常。design §2.3。

一个坏answer不丢弃同响应的其他好答案。

message不echo响应body。防止状态泄漏进日志。

扣掉5分。

扣分原因是它是小数据类。三个字段。
