# deerflow.skills.skillscan.models

## 一、这个模块是干什么的

这个模块定义SkillScan的数据契约。

SkillScan是DeerFlow的技能安全扫描系统。

用户可以安装技能包。

技能包里可能有代码。

代码里可能有恶意内容。

比如硬编码的密钥。

比如路径穿越。

安装前必须扫描。

扫描的结果需要一套固定结构。

这个模块就是那套结构。

每个发现字段都有消费方。

阻塞策略读severity。

Gateway的拒绝响应读全部字段。

代理工具错误读全部字段。

LLM扫描上下文也读全部字段。

规则的类别和所属分析器编码在rule_id前缀里。

不在单独字段里重复。

## 二、模块里的主要成员

- FindingSeverity：发现严重级别的类型。取值有CRITICAL、HIGH、MEDIUM、LOW。
- SecurityFinding：一条安全发现。包含rule_id、severity、file、line、message、remediation、evidence。
- ScanResult：一次扫描的结果。包含发现列表、是否阻塞、扫描器错误列表。
- RuleSpec：一条规则的静态定义。包含rule_id、severity、message、remediation。remediation在这里写一次，复制进发现。
- StaticScannerError：SkillScan在包边界无法评估输入时抛出的错误。
- StaticScanBlockedError：确定性发现阻塞技能写入或安装时抛出的错误。是ValueError的子类。携带发现列表和技能名。

## 三、它和谁协作

- 它被skills/skillscan/orchestrator.py引用。扫描器产出这些结构。
- 它被skills/installer.py、skills/review/analyzer.py、tools/skill_manage_tool.py引用。
- 这些消费方把发现呈现给用户或阻塞安装。

## 四、重要性评级

评级是4分。

理由是它是安全扫描的公共契约。

扫描结果的所有消费方依赖这套结构。

但它只有数据定义，没有逻辑。

字段设计稳定，风险较低。
