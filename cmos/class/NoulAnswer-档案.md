# NoulAnswer-档案

## 一、这个类是干什么的

NoulAnswer是typesafe/client.py里的冻结数据类。

它表示noul问题验证通过的概率。

noul是TypeSafe的两种问题类型之一。

另一种是choice。

这个类位于backend/packages/harness/deerflow/typesafe/client.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、字段

probability是float。验证通过的概率。

### 2、验证规则

概率必须来自_validate_noul。

bool被拒绝。bool是int子类。

NaN和Infinity被拒绝。json.loads会解析这些字面量。

概率必须在[0, 1]范围内。

OverflowError保持为per-question error。10的400次方这种JSON整数太大。float()装不下。不让它逃出丢弃同响应的其他有效答案。

### 3、获取方式

AnswerSet.noul(question_id)返回NoulAnswer或None。

失败的问题返回None。

## 三、它和谁协作

- AnswerSet.noul方法返回它。
- _validate_noul构建它。
- 消费者如memory prescreen和guardrails读取probability。

## 四、重要性评级

评级是4分。

理由如下。

这个类是noul答案的载体。

单字段。验证规则在_validate_noul里。

概率边界[0, 1]和bool拒绝是质量点。

扣掉6分。

扣分原因是它是一个字段的数据类。
