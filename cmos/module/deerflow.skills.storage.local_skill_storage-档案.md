# deerflow.skills.storage.local_skill_storage

## 一、这个模块是干什么的

这个模块是SkillStorage的本地文件系统实现。

背景是这样的。

技能存放在文件系统里。

布局是这样的。

根目录下有public目录。

public目录放公开技能。

根目录下有custom目录。

custom目录放用户自定义技能。

custom目录下还有.history目录。

.history目录放技能的历史记录。

这个类实现介质相关的原子操作。

包括读取技能。

包括写入技能文件。

写入用临时文件加原子改名。

包括删除技能文件。

包括从压缩包安装技能。

安装分阶段。

先解压到临时目录。

再经过安全扫描。

再落位。

安全扫描是异步的LLM调用。

扫描必须在事件循环上。

文件系统操作都在worker线程。

这个区分是刻意的。

## 二、模块里的主要成员

- LocalSkillStorage：本地文件系统存储类。继承SkillStorage。
- get_skills_root_path：返回技能根目录。
- custom_skill_exists、public_skill_exists：判断技能是否存在。
- _iter_skill_files：遍历技能文件。含SKILL.md的目录是包边界。嵌套的SKILL.md属于包内资源，不属于运行时注册表。
- read_custom_skill：读取自定义技能的SKILL.md。
- write_custom_skill：写入技能文件。临时文件加原子改名。写完设置沙箱可读权限。
- remove_custom_skill_file：删除技能文件。带投影变更保护。
- ainstall_skill_from_archive：从压缩包安装技能。异步。文件阶段在worker线程，扫描阶段在事件循环。
- _prepare_skill_archive：准备压缩包安装。解压、扫描、落位。

## 三、它和谁协作

- 它继承skills/storage/skill_storage.py的基类。
- 它被skills/storage/user_scoped_skill_storage.py继承。
- 它依赖skills/installer做压缩包扫描。
- 它依赖skills/permissions设置文件权限。
- 它被config的skills配置和skills包的加载流程使用。

## 四、重要性评级

评级是6分。

理由是它是技能存储的默认实现。

所有技能读写安装最终落到文件系统。

写入的原子改名和权限设置保证代理能读到技能。

安装流程的线程区分是并发正确性细节。

它是实际干活的实现，基类只是骨架。
