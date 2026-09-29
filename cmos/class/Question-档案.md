# Question-档案

## 一、这个类是干什么的

Question是typesafe/client.py里的冻结数据类。

它是请求里的一个问题。

映射键就是它的id。

typesafe共享客户端支持两种问题类型。

noul是概率问题。

choice是标签问题。

criteria对choice问题是答案标签。必需。

它是让返回标签有效的依据。

criteria对noul问题是可判断的criteria。可选。

这个类位于backend/packages/harness/deerflow/typesafe/client.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、Question字段

type是问题类型。必须在_QUESTION_TYPES里。

instructions必须是非空字符串。

criteria是标签到描述的映射。可选。

### 2、__post_init__验证

类型无效时抛ValueError。

instructions空时抛错。

choice问题必须有criteria。映射每个有效标签到描述。

criteria必须映射非空标签到非空描述。

### 3、答案数据类

NoulAnswer是noul问题验证过的概率。字段是probability。

ChoiceAnswer是choice问题验证过的标签。字段是label。

Answer是NoulAnswer或ChoiceAnswer的类型别名。

### 4、QuestionError

QuestionError是问题级失败。

请求可用。这个问题答案不可用。

category是missing、type、probability、label之一。

message指名问题。不重复响应体。

畸形或恶意端点能用回显状态填满响应体。

### 5、AnswerSet

AnswerSet是一个响应。拆成envelope级成功加每问题结果。

answers持有验证过的问题。

errors_by_question持有没验证的。

只有实际问的问题出现在两者里。

这个请求没问的问题的答案被忽略。不报告。

noul方法返回question_id的验证noul答案。失败时None。

### 6、_RetryableAttempt

内部类。TypeSafeError子类。

这次失败另一种尝试可能修复。

重试循环内抓住。预算耗尽时重抛成普通TypeSafeError。

永不逃出这个模块。

### 7、recordable_model和wire_size

wire_size报告wire状态的字节数。

recordable_model把模型名规约成可记录token。

## 三、它和谁协作

- TypeSafeClient发送问题和接收AnswerSet。
- TypeSafeMemoryPrescreen和TypeSafeSignalClassifier构造Question。
- _validate_answer验证原始响应。

## 四、重要性评级

评级是7分。

理由如下。

Question是TypeSafe评判协议的核心数据结构。

choice和noul两种问题类型验证完整。

AnswerSet拆分envelope成功和每问题结果。

未问的问题的答案被忽略。

QuestionError不重复响应体。防恶意端点回填。

_RetryableAttempt永不逃出模块。

这些是共享客户端协议正确性的关键。

扣掉3分。

扣分原因是它是数据类。逻辑在客户端。
