# RuleSpec档案

源码位置：backend/packages/harness/deerflow/skills/skillscan/models.py

## 一、这个类是干什么的

RuleSpec是一条SkillScan规则的静态定义。

静态扫描由约40条规则组成。每条规则一个RuleSpec。规则声明自己的标识、严重级别、消息、修复建议。

RuleSpec是frozen dataclass。RuleSpec创建后不能修改。

## 二、类的成员

（一）字段

- rule_id：规则标识。前缀编码规则类别和所属分析器。
- severity：严重级别。CRITICAL、HIGH、MEDIUM、LOW四选一。
- message：规则触发时的问题描述。
- remediation：修复建议。修复建议在这里只写一次。写完拷贝进每条finding。

## 三、它和谁协作

（一）规则表

orchestrator的_SPECS列表装全部RuleSpec。RULES字典按rule_id索引。分析器按规则扫描。触发时用spec的message和remediation构造finding。

（二）确定性

RuleSpec是声明式的。规则的判定逻辑在分析器函数里。声明在RuleSpec里。声明和分析分离让规则可审查。

## 四、重要性评级

评级：5分。

理由：RuleSpec是SkillScan规则体系的声明单元。约40条规则每条一个声明。remediation单点维护防止漂移。CRITICAL级别由声明驱动阻断。它是frozen dataclass。给5分。
