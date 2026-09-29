# SlashSkillReference档案

源码位置：backend/packages/harness/deerflow/skills/slash.py

## 一、这个类是干什么的

SlashSkillReference是解析后的斜杠技能命令。

用户在输入框输入/skill-name加任务文本。输入先要解析。解析结果用SlashSkillReference表示。

SlashSkillReference是frozen dataclass。SlashSkillReference用slots。SlashSkillReference只装解析结果。SlashSkillReference不判断技能是否存在。

## 二、类的成员

（一）字段

- name：技能名。来自斜杠后的第一段。
- remaining_text：剩下的任务文本。

## 三、它和谁协作

（一）产生者

parse_slash_skill_reference函数产出SlashSkillReference。解析用_SLASH_SKILL_RE正则。正则要求/后是小写字母数字加连字符。解析跳过保留控制命令。保留命令有agent、bootstrap、context、goal、help、memory、models、new、status九个。例外是context加compact以外的参数仍算技能激活。

（二）消费者

resolve_slash_skill拿SlashSkillReference去匹配启用的技能。匹配成功产出ResolvedSlashSkill。解析语法与前端slash.ts镜像。两边的值钉在contracts/slash_skill_contract.json上。契约测试保证两边一致。

## 四、重要性评级

评级：4分。

理由：SlashSkillReference是斜杠激活的第一步产物。它把命令语法和技能查找分开。解析规则和前端共享契约。它是两字段的frozen dataclass。给4分。
