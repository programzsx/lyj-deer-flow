# SkillEntryMetadata档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/skill_context.py`

## 一、这个类是干什么的

SkillEntryMetadata是一条已加载技能的元数据记录。

模型在本线程里加载了某个技能文件。
持久上下文采集的时候要记住这个技能。

记住的是引用。不是技能正文。

这个类就是那条引用。
它记录技能文件的路径和描述。

DurableContextMiddleware采集skill_context时用这个形状。
注入时模型看到的是名字、路径、描述。不是SKILL.md全文。

这个类是TypedDict。纯数据。

## 二、类的成员

### （一）字段

- `path`：技能容器文件的路径。
- `description`：技能的描述。

### （二）方法

SkillEntryMetadata没有定义自己的方法。

## 三、它和谁协作

- DurableContextMiddleware采集它进ThreadState.skill_context。
- SkillActivationMiddleware的密钥解析读skill_context里的条目。
- merge_skill_context归约器按路径去重这些条目。

## 四、重要性评级

评级：4/10。

理由：SkillEntryMetadata是技能上下文引用的数据形状。它决定了只存引用不存正文的设计边界。这个边界控制了上下文体积。它是小数据类。所以给4分。