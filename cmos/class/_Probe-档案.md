# _Probe-档案

## 一、这个类是干什么的

_Probe是guardrails/typesafe.py里的冻结数据类。

它是一个本地验证过的、值得发送给TypeSafe的调用。

字段是tool_name、arguments_text、state_digest。

这个类位于backend/packages/harness/deerflow/guardrails/typesafe.py。

## 二、类的成员（字段，各自做什么）

### 1、字段

tool_name是工具名。

arguments_text是调用参数文本。

state_digest是状态的摘要。不是状态本身。

## 三、它和谁协作

- guardrails middleware构建它。
- 发送给TypeSafe做概率判断。

## 四、重要性评级

评级是3分。

理由如下。

这个类是TypeSafe发送候选的载体。

三个字段。工具名加参数文本加状态摘要。

state_digest用摘要。不用全文。

扣掉7分。

扣分原因是它是三字段的内部载体。
