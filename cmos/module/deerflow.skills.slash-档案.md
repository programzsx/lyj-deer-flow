# deerflow.skills.slash-档案

## 一、这个模块是干什么的

这个模块处理斜杠技能激活。

用户可以输入"/skill-name 任务内容"。这个语法表示用户明确要求激活某个技能。运行时会把那个技能的SKILL.md内容注入当前这次模型调用。

这个模块负责两件事。第一件事是解析文本。判断文本是不是合法的斜杠技能语法。第二件事是把解析结果解析成一个真正启用、真正可见的技能。

## 二、模块里的主要成员

### 1、RESERVED_SLASH_SKILL_NAMES

这是一个frozenset。它列出保留的命令名。

保留名有agent、bootstrap、context、goal、help、memory、models、new、status。

这些名字被前端的其他命令占用。用户输入"/new"是想开新会话。不是想激活叫new的技能。这些名字不能被技能激活抢走。

### 2、_SLASH_SKILL_RE正则

这个正则定义严格语法。文本以斜杠开头。技能名必须是小写字母数字加连字符。名字后面必须是空白或文本结束。

### 3、SlashSkillReference数据类

SlashSkillReference装原始解析结果。用frozen加slots定义。有两个字段。name是技能名。remaining_text是剩下的任务文本。

### 4、ResolvedSlashSkill数据类

ResolvedSlashSkill装激活结果。也有frozen加slots。有三个字段。skill是Skill对象。remaining_text是任务文本。container_file_path是SKILL.md的容器路径。

### 5、parse_slash_skill_reference函数

这个函数做严格的语法解析。

正则不匹配返回None。这意味着拒绝前导空白。拒绝大写名字。拒绝没有分隔符的语法。

名字是保留名时被拒绝。有一个例外。技能叫context时。如果任务文本不是"compact"。context仍然可以激活。因为"/context compact"是前端composer的专用别名。"/context 其他内容"应该是叫context的自定义技能。

### 6、resolve_slash_skill函数

这个函数把解析结果解析成激活。

函数先调parse_slash_skill_reference。解析失败返回None。

函数再检查白名单。调用方可以传available_skills集合。名字不在集合里返回None。这对应自定义agent的技能白名单。

函数最后在skills列表里找同名且enabled的技能。找不到返回None。禁用的技能不能激活。

找到了返回ResolvedSlashSkill。容器路径用get_container_file_path算。

## 三、它和谁协作

前端有一个对应的解析器。前端文件是frontend/src/core/skills/slash.ts。两边的保留名和语法互相镜像。

两边由契约测试钉住。契约文件是contracts/slash_skill_contract.json。这边的测试是test_slash_skill_contract.py。前端的测试是slash-contract.test.ts。只改一边会挂CI。

运行时的SkillActivationMiddleware用resolve_slash_skill来决定要不要注入技能内容。激活结果会被持久化成运行上下文里的源。整个工具循环都保持绑定。

它依赖types模块的Skill。它依赖constants模块的容器路径常量。

## 四、重要性评级

评级是6分（满分10分）。

理由：

斜杠激活是用户显式控制技能的主要入口。解析错了会产生两种后果。用户想开新会话被当成激活技能。用户想激活被当成普通文本。

保留名机制保护了前端命令的兼容性。context加compact的特殊处理解决了保留名和自定义技能名冲突的边界情况。

跨语言契约测试保护了两端不漂移。这个工程实践值得肯定。

它的代码量小。逻辑清晰。影响面集中。所以给6分。
