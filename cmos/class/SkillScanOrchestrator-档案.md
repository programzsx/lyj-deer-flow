# SkillScanOrchestrator-档案

## 一、这个类是干什么的

skillscan/orchestrator.py没有一个大类叫Orchestrator。

这个模块是DeerFlow技能的本地确定性扫描。

核心函数是scan_archive_preflight和scan_skill_dir。

它们是输入的同步纯函数。

异步调用方必须把它们派发到事件循环外。

策略是一个代码常量。

CRITICAL阻止。

其他都是警告。

enforce_static_scan应用这个策略。

它也尊重skill_scan.enabled杀开关。

规则spec放在匹配它们的分析器旁边。

一条规则在一个地方编写、阅读、测试。

这个模块位于backend/packages/harness/deerflow/skills/skillscan/orchestrator.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、常量

- MAX_TOTAL_ARCHIVE_BYTES是512MiB。归档总解压大小上限。
- MAX_FILE_BYTES是64MiB。单文件上限。
- _MAX_ARCHIVE_MEMBERS是4096。成员数上限。
- _TEXT_PROBE_BYTES是4096。文本探测字节数。

### 2、规则spec

_SPECS列表定义约40条规则。

规则覆盖六类。

package类检查包结构。包括路径穿越、绝对路径、NTFS交替数据流、符号链接、嵌套SKILL.md、超大总数、成员过多、单文件超大、可执行二进制、嵌套归档、隐藏敏感文件、不可解码脚本、git目录。

secret类检查密钥。包括私钥、云令牌、env赋值。

declaration类检查SKILL.md声明。包括提示词覆盖短语、敏感能力、敏感路径、外部端点。

python类检查Python代码。包括动态执行、shell执行、敏感外泄、env批量外泄、反向shell、动态导入、subprocess、敏感路径读、不安全反序列化。

shell类检查shell脚本。包括反向shell、敏感外泄、curl管道shell、破坏性命令、env dump。

network和resource类检查云元数据服务、fork炸弹、明文HTTP。

### 3、enforce_static_scan函数

这个函数应用扫描策略。

CRITICAL发现抛StaticScanBlockedError。

skill_scan.enabled为False时跳过扫描。

### 4、scan_archive_preflight函数

这个函数对.skill ZIP归档做预检。

同步纯函数。

检查zipfile的结构。

路径穿越、绝对路径、冒号、符号链接、嵌套SKILL.md都在这里检。

### 5、scan_skill_dir函数

这个函数对技能目录做扫描。

同样同步纯函数。

### 6、代码分析

Python代码用ast模块分析。

AST访问器检出动态执行、shell执行、反向shell形状、不安全反序列化。

敏感读加网络汇出在同一文件时组合成exfil规则。

shell脚本按行分析。

反向shell、curl管道、破坏性命令在这里检。

## 三、它和谁协作

- skill_manage_tool在技能写入前调用enforce_static_scan。
- skills/installer在归档安装前做预检。
- StaticScanBlockedError被上层转成带findings的错误。
- package_files和package_paths提供文件类型判断。

## 四、重要性评级

评级是8分。

理由如下。

这个模块是技能安装安全的第一道防线。

约40条确定性规则覆盖包结构、密钥、声明、Python、shell、网络六类。

不依赖LLM扫描。

零成本、确定性、离线。

规则spec和分析器放在一起。

一条规则一个地方编写测试。

CRITICAL阻止策略简单明确。

杀开关让运维可以跳过。

扣掉2分。

扣分原因是它只做静态检查。

复杂语义要靠LLM扫描器。
