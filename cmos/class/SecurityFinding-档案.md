# SecurityFinding-档案

## 一、这个类是干什么的

SecurityFinding是skills/skillscan/models.py里的TypedDict。

这个类表示DeerFlow SkillScan的一条安全发现。

SkillScan是技能的静态安全扫描。

每个字段的消费方如下。

severity被阻止策略读取。

其余字段被Gateway拒绝响应、代理工具错误、LLM扫描器上下文读取。

规则类目和拥有分析器编码在rule_id前缀里。

前缀包括package-、secret-、declaration-、python-、shell-、network-、resource-。

不重复成单独字段。

这个模块位于backend/packages/harness/deerflow/skills/skillscan/models.py。

## 二、类的成员（字段、方法，各自做什么）

这是TypedDict。

字段如下。

- rule_id是规则id。前缀编码规则类目。
- severity是严重级别。取值是CRITICAL、HIGH、MEDIUM、LOW。CRITICAL会阻止写入或安装。
- file是发现所在的文件。可为None。
- line是行号。可为None。
- message是人类可读的发现说明。
- remediation是补救建议。
- evidence是证据文本。可为None。

### 配套类型

同模块还有配套类型。

- ScanResult是TypedDict。包括findings、blocked、scanner_errors。这个名字在代码库里有两个同名类。另一个在skills/security_scanner.py。写第二份时要用@格式。
- RuleSpec是frozen数据类。静态定义一条SkillScan规则。remediation在这里编写一次并复制进findings。
- StaticScannerError是RuntimeError。SkillScan在包边界无法评估输入时抛出。
- StaticScanBlockedError是ValueError。确定性发现阻止技能写入或安装时抛出。带findings和skill_name。

## 三、它和谁协作

- orchestrator.py的分析器产出这些发现。
- enforce_static_scan按severity决定阻止。
- skill_manage_tool把findings带进错误消息。
- Gateway的拒绝响应读取它们。

## 四、重要性评级

评级是5分。

理由如下。

这个类型是技能安全扫描的发现词汇。

severity直接决定阻止行为。

rule_id前缀编码避免字段重复。

补救建议在规则定义处编写一次。

但它是纯数据结构。

没有行为。

扣掉5分。
