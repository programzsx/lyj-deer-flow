# ResolvedSlashSkill档案

源码位置：backend/packages/harness/deerflow/skills/slash.py

## 一、这个类是干什么的

ResolvedSlashSkill是解析并匹配成功后的斜杠技能激活。

SlashSkillReference只装解析结果。解析结果还要匹配技能。匹配成功后才有ResolvedSlashSkill。

ResolvedSlashSkill是frozen dataclass。ResolvedSlashSkill用slots。ResolvedSlashSkill装着激活所需的全部信息。

## 二、类的成员

（一）字段

- skill：匹配到的Skill。技能必须是启用的。
- remaining_text：剩下的任务文本。
- container_file_path：技能SKILL.md在容器里的完整路径。

## 三、它和谁协作

（一）产生者

resolve_slash_skill函数产出ResolvedSlashSkill。流程是这样的。先解析文本成SlashSkillReference。再检查白名单。再在技能列表里找同名且启用的技能。都通过才产出。

（二）消费者

调用方拿到ResolvedSlashSkill后。用container_file_path读SKILL.md。用remaining_text作为任务输入。

## 四、重要性评级

评级：4分。

理由：ResolvedSlashSkill是斜杠激活的最终产物。它把解析、匹配、路径三步的结果合并成一个不可变值。调用方不用再查第二次。它是三字段的frozen dataclass。给4分。
