# _Answer-档案

## 一、这个类是干什么的

_Answer是guardrails/typesafe.py里的冻结数据类。

它表示一个TypeSafe验证通过的答案。

字段是probability加model。

这个文档覆盖_Answer加_CacheEntry、_Probe。

位于backend/packages/harness/deerflow/guardrails/typesafe.py。

## 二、类的成员（字段，各自做什么）

### 1、_Answer字段

probability是float。验证通过的概率。

model是服务的model。已缩减为可记录的token。

### 2、_CacheEntry字段

allow是bool。允许还是拒绝。

probability是float。判断的概率。

它是guardrails答案缓存的entry。

### 3、_Probe字段

tool_name是工具名。

arguments_text是调用参数文本。

state_digest是状态摘要。

它是本地验证过的、值得发送给TypeSafe的调用。

### 4、TypeSafeGuardrailError对照

TypeSafeGuardrailError继承TypeSafeError。

它表示TypeSafe evaluation不能产生可用的verdict。

middleware把它映射为guardrails.fail_closed。

它永不降级为allow。

## 三、它和谁协作

- guardrails middleware消费_Answer和_CacheEntry。
- _Probe是发送前的候选。
- AnswerCache缓存。

## 四、重要性评级

评级是4分。

理由如下。

这些类是guardrails TypeSafe评估的内部载体。

_Answer带概率加model。

_CacheEntry缓存allow决定。

_Probe筛选值得发送的调用。

fail_closed永不降级为allow。

扣掉6分。

扣分原因是它们是内部数据类。
