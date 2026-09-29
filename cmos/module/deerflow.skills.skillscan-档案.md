# deerflow.skills.skillscan包档案

## 一、这个模块是干什么的

deerflow.skills.skillscan包是技能安全扫描器的包门面。

源文件是backend/packages/harness/deerflow/skills/skillscan/__init__.py。

它的角色是立即导入式门面。

它把安全扫描的全部公共API一次性导入并暴露。

它没有懒加载。

docstring一句话说明定位。

定位是DeerFlow技能的原生确定性安全扫描器。

扫描器在技能安装前检查恶意内容。

扫描器是确定性的。

扫描器不依赖LLM。

## 二、模块里的主要成员

它从两个模块导入成员。

models模块提供六个成员。

成员是FindingSeverity、RuleSpec、ScanResult、SecurityFinding、StaticScanBlockedError、StaticScannerError。

FindingSeverity是发现的严重级别。

RuleSpec是规则规格。

ScanResult是扫描结果。

SecurityFinding是安全发现。

StaticScanBlockedError表示静态扫描拦截。

StaticScannerError是扫描器错误基类。

orchestrator模块提供六个成员。

成员是RULES、enforce_static_scan、format_static_findings、scan_archive_preflight、scan_skill_dir、skill_scan_enabled。

RULES是内置规则集。

enforce_static_scan执行强制扫描。

format_static_findings格式化发现。

scan_archive_preflight扫描归档预检。

scan_skill_dir扫描技能目录。

skill_scan_enabled判断扫描是否启用。

十二个成员在__all__里。

## 三、它和谁协作

它向内聚合models和orchestrator两个模块。

它向上被技能安装流程消费。

安装技能前先做扫描。

扫描不通过则安装被拦截。

它与deerflow.skills协作。

父包的installer模块暴露SkillSecurityScanError。

这个错误类型对应这里的扫描拦截。

它与review子包协作。

skillscan做安全扫描。

review做评审。

两者共同构成技能质量防线。

## 四、重要性评级

评级是6分。

理由如下。

它是技能安全扫描的正式契约入口。

规则集加扫描器加错误类型构成完整的扫描词汇。

静态扫描拦截是防止恶意技能进入系统的关键防线。

扣分点在于它内容较多。

成员多意味着维护面大。

但成员都是稳定的规则和模型。
