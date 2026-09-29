# AnswerSet-档案

## 一、这个类是干什么的

AnswerSet是typesafe/client.py里的冻结数据类。

它表示一次响应。拆成envelope级成功加per-question结果。

answers持有验证通过的问题。

errors_by_question持有没通过的问题。

只有实际问的问题出现在两边。

请求没问过的问题的answer被忽略。不报告。

这个文档覆盖AnswerSet加相关的NoulAnswer、ChoiceAnswer、QuestionError、_RetryableAttempt。

位于backend/packages/harness/deerflow/typesafe/client.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、AnswerSet字段

model是响应声明的模型。

answers是Mapping。key是question_id。value是Answer。

errors_by_question是Mapping。key是question_id。value是QuestionError。

### 2、noul方法

返回question_id的noul answer。

失败时返回None。

类型不对时也返回None。

### 3、NoulAnswer

probability字段。noul问题的验证通过的概率。

### 4、ChoiceAnswer

label字段。choice问题的验证通过的标签。

### 5、QuestionError

question_id、category、message。

category是missing、type、probability、label之一。

message命名问题。不重复响应body。恶意的端点会用echo填满body。

### 6、_RetryableAttempt

它继承TypeSafeError。内部类。

这个attempt以另一种attempt可能修复的方式失败。

重试循环内捕获。attempt预算耗尽时重抛为普通TypeSafeError。

永不逃出这个模块。

### 7、_validate_answer系列

_validate_answer校验单个answer。

raw为None是missing。

raw不是dict是type。

type不匹配是type。只报告type名。answer本身是响应内容。可能把state echo回日志。

noul走_validate_noul。bool被拒绝。bool是int子类。

NaN和Infinity被拒绝。json.loads会解析这些字面量。

概率必须在[0, 1]。OverflowError保持为per-question error。不让它逃出丢弃同响应的其他有效答案。

choice走_validate_choice。label必须是criteria里的非空字符串。

### 8、问题级失败是数据不是异常

一次格式错误的answer不能丢弃同一响应里的其他有效答案。

消费者决定"这个问题没有结果"是什么意思。design §2.3。

## 三、它和谁协作

- TypeSafeClient的_parse构建AnswerSet。
- Question定义问题。
- 消费者如guardrails和memory prescreen读取answers和errors。
- AnswerCache和CachedVerdict记录per-answer模型来源。

## 四、重要性评级

评级是7分。

理由如下。

这个类是TypeSafe响应的拆分边界。

envelope级成功加per-question结果的拆分。

一个问题失败不拖垮整批答案。

QuestionError不echo响应body。

_RetryableAttempt永不逃出模块。预算耗尽时收敛为TypeSafeError。

概率校验拒绝bool、NaN、Infinity、Overflow。

这些是响应解析正确性的核心。

扣掉3分。

扣分原因是它是解析结果的数据类。自身逻辑量中等。
