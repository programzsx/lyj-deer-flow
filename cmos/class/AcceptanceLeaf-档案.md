# AcceptanceLeaf档案

源码位置：backend/packages/harness/deerflow/subagents/acceptance_checks.py

## 一、这个类是干什么的

AcceptanceLeaf是一条验收标准的检查结果。

lead给task委派附带验收标准。每条标准被检查后产生一个AcceptanceLeaf。

AcceptanceLeaf是TypedDict。

AcceptanceLeaf的核心是两个布尔字段的分层。checked表示跑过确定性检查。holds表示检查通过。checked为False时holds一定是False。

## 二、类的成员

（一）字段

- criterion：原始标准文本。有界。
- family：叶子家族。取值是file_exists、file_non_empty、file_json_valid、file_written、tests_passed、undecidable六选一。
- checked：是否跑过确定性检查。
- holds：checked且条件成立。unchecked时一定是False。
- detail：简短的证据说明。有界。

## 三、它和谁协作

（一）检查逻辑

acceptance_checks.py的检查函数填充AcceptanceLeaf。file家族的叶子通过读文件检查。tests_passed的叶子锚定到记录的bash执行。不可判定的标准是undecidable。undecidable永远不静默通过。

（二）下游

AcceptanceLeaf装进AcceptanceVerdict的leaves列表。叶子渲染成模型可见的检查清单。

## 四、重要性评级

评级：4分。

理由：AcceptanceLeaf是验收系统的最小结论单元。checked和holds的分层词汇防止自我报告静默通过可检查的要求。它是五字段TypedDict。给4分。
