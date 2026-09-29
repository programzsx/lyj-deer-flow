# StaticScanBlockedError档案

源码位置：backend/packages/harness/deerflow/skills/skillscan/models.py

## 一、这个类是干什么的

StaticScanBlockedError是确定性发现阻断技能写入或安装时的错误。

扫描发现CRITICAL finding。CRITICAL finding触发阻断。阻断要携带完整的finding列表和技能名。StaticScanBlockedError就是这个载体。

StaticScanBlockedError继承ValueError。

## 二、类的成员

（一）字段

- findings：触发阻断的finding列表。每个finding是字典拷贝。
- skill_name：技能名。可以为None。None表示阻断的是技能内容而不是具名技能。

## 三、它和谁协作

（一）抛出者

enforce_static_scan过滤CRITICAL finding。有CRITICAL时抛出。消息带format_static_findings渲染的全部阻断项。

（二）消费者

installer.py和skill_manage_tool捕获它。阻断转成SkillSecurityScanError或工具错误。错误里的findings让调用方看到每条阻断的rule_id、severity、message、remediation。

## 四、重要性评级

评级：5分。

理由：StaticScanBlockedError是SkillScan的阻断出口。CRITICAL finding靠它变成硬失败。finding拷贝保护内部状态。技能名让错误可定位。它是扫描安全链的执行点。给5分。
