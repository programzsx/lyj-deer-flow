# SkillSecurityScanError档案

源码位置：backend/packages/harness/deerflow/skills/installer.py

## 一、这个类是干什么的

SkillSecurityScanError是技能安装的安全扫描错误。

安装技能包前要做安全扫描。扫描发现阻断性finding时安装要失败。失败要携带完整的finding列表。SkillSecurityScanError就是这个载体。

SkillSecurityScanError继承ValueError。SkillSecurityScanError带findings列表和技能名。

## 二、类的成员

（一）字段

- findings：静态扫描的finding列表。每个finding是字典拷贝。拷贝防止外部修改内部状态。
- skill_name：技能名。可以为None。None表示扫描的是技能内容而不是具名技能包。

## 三、它和谁协作

（一）扫描器

skillscan编排器产出findings。enforce_static_scan发现CRITICAL finding时抛StaticScanBlockedError。安装路径把阻断转换成SkillSecurityScanError。

（二）消费者

Gateway安装路由和skill_manage_tool捕获它。findings转成响应里的详细错误。模型工具错误里带finding的rule_id、severity、message、remediation。

## 四、重要性评级

评级：4分。

理由：SkillSecurityScanError是安装路径的安全失败载体。它让阻断性finding完整到达调用方。finding拷贝保护内部状态。它是安装安全链的最后一环。给4分。
