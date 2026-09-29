# deerflow.skills.storage.skill_storage

## 一、这个模块是干什么的

这个模块是技能存储的抽象基类。

背景是这样的。

技能存放在文件系统里。

技能的读取、写入、安装、删除都是存储操作。

存储介质可能有多种实现。

比如本地文件系统。

抽象基类定义一套流程。

子类实现介质相关的原子操作。

基类用模板方法把这些操作组合成完整流程。

模板方法包括load_skills。

包括历史记录序列化。

包括路径辅助函数。

包括校验。

这个模块还有两个公开的辅助函数。

一个是遍历技能目录的函数。

遍历会跟随目录链接。

但要剪掉指回祖先的链接。

否则会死循环。

另一个是读文本的函数。

读到非文本返回None。

给历史记录用。

## 二、模块里的主要成员

- SkillStorage：抽象基类。定义技能存储的模板方法流程。
- validate_skill_name：校验并归一化技能名。名字必须是小写字母、数字、连字符。上限64字符。
- validate_relative_path：校验相对路径。解析后的目标必须落在技能目录内。防止路径穿越。
- validate_skill_markdown_content：校验SKILL.md内容。解析frontmatter并检查名字匹配。
- load_skills：加载所有技能。组合子类的原子操作。
- walk_skill_directories(root)：遍历技能目录。跟随目录链接，剪掉回指祖先的链接。
- read_text_or_none(path)：读文本。非文本返回None。

## 三、它和谁协作

- 它被skills/storage/local_skill_storage.py继承。
- 它被skills/storage/user_scoped_skill_storage.py间接继承。
- 它被skills包的加载流程使用。
- 它被sandbox provider和skill工具引用。

## 四、重要性评级

评级是6分。

理由是它是所有技能存储实现的骨架。

路径校验函数是安全边界。

穿越的相对路径在这里被拒绝。

遍历的链接剪枝防止死循环。

所有技能读写最终都走这套模板。

但它的直接逻辑是流程编排，介质细节在子类里。
