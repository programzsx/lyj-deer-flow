# SkillAlreadyExistsError档案

源码位置：backend/packages/harness/deerflow/skills/installer.py

## 一、这个类是干什么的

SkillAlreadyExistsError是技能重名的错误。

安装技能时目标名字可能已经存在。重名安装会覆盖已有技能。覆盖不是预期行为。安装流程检测到重名就抛这个异常。

SkillAlreadyExistsError继承ValueError。SkillAlreadyExistsError是空异常类。

## 二、类的成员

SkillAlreadyExistsError没有自定义字段。SkillAlreadyExistsError没有自定义方法。

## 三、它和谁协作

（一）抛出者

installer.py的安装流程检查目标目录。目标已存在时抛出。

（二）消费者

Gateway技能安装路由和skill_manage_tool捕获它。错误转成明确的"已存在"响应。用户被引导改名或删除旧技能。

## 四、重要性评级

评级：2分。

理由：SkillAlreadyExistsError只是一个重名分类标记。它的存在让重名安装成为明确失败而不是静默覆盖。它是一个空异常类。给2分。
