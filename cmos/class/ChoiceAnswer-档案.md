# ChoiceAnswer-档案

## 一、这个类是干什么的

ChoiceAnswer是typesafe/client.py里的冻结数据类。

它表示choice问题验证通过的标签。

choice是TypeSafe的两种问题类型之一。

另一种是noul。

这个类位于backend/packages/harness/deerflow/typesafe/client.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、字段

label是str。验证通过的标签。

### 2、验证规则

label必须来自_validate_choice。

label必须是非空字符串。

label必须在question.criteria里。

criteria映射每个有效标签到它的描述。

### 3、获取方式

AnswerSet.answers里按question_id取。

类型检查后是ChoiceAnswer才算有效。

## 三、它和谁协作

- AnswerSet持有它。
- _validate_choice构建它。
- Question的criteria定义有效标签。

## 四、重要性评级

评级是4分。

理由如下。

这个类是choice答案的载体。

单字段。标签必须在criteria里。

这防止端点返回任意标签。

扣掉6分。

扣分原因是它是一个字段的数据类。
