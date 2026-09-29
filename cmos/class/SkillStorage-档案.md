# SkillStorage-档案

## 一、这个类是干什么的

SkillStorage是skills/storage/skill_storage.py里的抽象基类。

它是技能存储后端的抽象基。

它是模板方法模式的基类。

子类实现少量存储介质特有的原子操作。

这个基类提供最终的模板方法流程。

模板方法包括load_skills、历史序列化、路径helper、验证。

这些流程用协议级helper组合子类操作。

这个类位于backend/packages/harness/deerflow/skills/storage/skill_storage.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、静态协议helper

- validate_skill_name验证并规整技能名。名字必须是小写连字符形。只能用小写字母、数字、连字符。最多64字符。
- validate_relative_path验证相对路径。目标必须在技能目录内。防路径穿越。
- validate_skill_markdown_content验证SKILL.md内容。在临时目录解析frontmatter。检查frontmatter名字和请求的技能名一致。

### 2、抽象方法

子类必须实现这些。

- _iter_skill_files对每个SKILL.md产出(category, category_root, md_path)。
- read_custom_skill读自定义技能的SKILL.md内容。
- write_custom_skill在custom/<name>/<relative_path>下原子写文本文件。
- ainstall_skill_from_archive从.skill ZIP归档异步安装。
- delete_custom_skill删除自定义技能。
- custom_skill_exists判断自定义技能存在。
- public_skill_exists判断公开技能存在。
- append_history追加JSONL历史条目。
- read_history返回全部历史记录，最旧在前。

### 3、具体路径helper

- get_container_root返回容器根。
- get_custom_skill_dir返回custom/<name>路径。
- get_custom_skill_file返回custom/<name>/SKILL.md路径。
- get_skill_history_file返回历史JSONL路径。

注意默认实现返回全局技能根下的路径。

这对LocalSkillStorage正确。

对UserScopedSkillStorage不正确。

重定向自定义技能路径的子类必须重写这个方法。

### 4、最终模板方法

- load_skills发现全部技能、合并启用状态、排序、可选过滤。启用状态从extensions config重读。每个类目都尊重extensions_config的启用状态。CUSTOM技能没有显式配置条目时默认启用。新装的技能不用手动开关就显示为活跃。
- ensure_custom_skill_is_editable只有CUSTOM类目可编辑。PUBLIC和LEGACY是只读的。尝试编辑抛ValueError带建议。
- remove_custom_skill_file删除支持文件并返回之前的文本内容。非UTF-8文本返回None。前内容只喂历史记录。绝不阻止删除。目录被拒绝而不是删除。
- install_skill_from_archive是同步包装。

### 5、walk_skill_directories函数

这个模块级函数跟随目录链接。

但修剪回当前祖先的链接。

保持os.walk的可变目录列表。

调用方保留命名空间、隐藏目录和包边界规则。

只跟踪当前分支。

外部技能树的两个独立别名都必须可发现。

### 6、read_text_or_none函数

这个函数返回UTF-8文本或None。

历史记录专用。

技能的支持文件可能是二进制。

安装器拒绝可执行二进制，不拒绝图片或其他资产。

记录"no previous text"绝不能中止正在记录的变更。

## 三、它和谁协作

- LocalSkillStorage和UserScopedSkillStorage是子类。
- skill_manage_tool调用它的写入和验证方法。
- load_skills被prompt装配消费。
- skills/parser的parse_skill_file解析技能文件。
- skills/installer处理归档安装。

## 四、重要性评级

评级是8分。

理由如下。

这个类是技能存储的骨架。

所有技能读写、安装、删除、历史都经过它。

模板方法让两种存储后端共享验证、路径、加载流程。

技能名验证、路径穿越防护、frontmatter验证都在这里。

启用状态合并让跨进程变更立即生效。

二进制资产的历史处理有细节。

它的子类直接决定技能系统的行为。

扣掉2分。

扣分原因是抽象层本身没有介质逻辑。
