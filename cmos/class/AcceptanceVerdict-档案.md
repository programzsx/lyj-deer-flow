# AcceptanceVerdict档案

源码位置：backend/packages/harness/deerflow/subagents/acceptance_checks.py

## 一、这个类是干什么的

AcceptanceVerdict是一次验收检查的结论。

lead给task委派附带acceptance_criteria。子Agent完成后。acceptance_checks.py用代码检查可判定的标准。检查结果用AcceptanceVerdict表示。

AcceptanceVerdict是TypedDict。

AcceptanceVerdict装着这些。leaves是每条标准的检查结果。unchecked是没有确定性检查的标准。all_hold是所有叶子都checked且holds。

## 二、类的成员

（一）字段

- source：结论来源。固定为acceptance_checklist。
- requirement：要求标识。固定为delegation_acceptance_criteria。
- leaves：叶子结果列表。每条标准一个AcceptanceLeaf。
- unchecked：没有确定性检查的标准列表。这些是PR5判断器的输入。
- all_hold：是否所有叶子都checked且holds。

## 三、它和谁协作

（一）叶子结构

AcceptanceLeaf是单条标准的检查结果。AcceptanceLeaf有criterion、family、checked、holds、detail五个字段。叶子家族有file_exists、file_non_empty、file_json_valid、file_written、tests_passed、undecidable。

（二）下游

AcceptanceVerdict进delegation ledger的acceptance段。结论也渲染成模型可见的检查清单附加到结果文本。validate_acceptance_verdict在读侧校验。

## 四、重要性评级

评级：5分。

理由：AcceptanceVerdict是确定性验收检查的结论载体。它的词汇分层（checked/holds）防止模型把执行证据当成任务验收。leaves加unchecked的结构给PR5判断器留了输入。它是TypedDict结构。给5分。
