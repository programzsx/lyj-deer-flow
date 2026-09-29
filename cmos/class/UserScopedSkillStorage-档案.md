# UserScopedSkillStorage-档案

## 一、这个类是干什么的

UserScopedSkillStorage是skills/storage/user_scoped_skill_storage.py里的类。

它是每用户隔离的技能存储。

它继承LocalSkillStorage。

自定义技能存到{base_dir}/users/{user_id}/skills/custom/。

不在全局{base_dir}/skills/custom/。

公开技能仍然从全局{base_dir}/skills/public/读。只读。

这个类防止两个用户拥有同名自定义技能时跨用户串扰。

这个类位于backend/packages/harness/deerflow/skills/storage/user_scoped_skill_storage.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、布局

- <host_root>/public/<name>/SKILL.md是全局只读。
- <user_custom_root>/<name>/SKILL.md是每用户读写。
- <integrations_root>/<provider>/<name>/SKILL.md是全局只读。
- <user_custom_root>/.history/<name>.jsonl是每用户历史。
- <user_skills_root>/_skill_states.json是每用户启用状态。
- <global_custom_root>/<name>/SKILL.md是旧版回退，只读。

### 2、构造方法

构造方法接受user_id、host_path、container_path、app_config。

user_id经过验证。

解析四个路径根。

_user_custom_root是用户自定义技能根。

_integrations_root是集成技能根。

_user_skills_root是用户技能根。

_skill_states_file是每用户状态文件。

### 3、LEGACY回退语义

用户还没有自定义技能时。

全局skills/custom/的技能以SkillCategory.LEGACY产出。

只读。可见但不能被用户编辑或删除。

这保留迁移期间的向后兼容。

不给用户其他用户的legacy技能的可变访问。

旧版技能在沙箱里挂载在/mnt/skills/legacy/<name>/。

支持文件对代理可访问。

设计注记如下。

用户创建了第一个自定义技能后。

每用户目录存在。

全局自定义回退不再适用。

LEGACY技能从该用户的列表消失。

这是有意的。

这是shadow-mount语义。

用户自己的目录遮蔽全局的。

### 4、每用户启用状态

CUSTOM和LEGACY技能的启用状态存在每用户的_skill_states.json。

按技能名做键。

PUBLIC技能状态保持在全局extensions_config.json。

这防止两个用户拥有同名自定义技能时跨用户串扰。

### 5、_read_skill_states方法

这个方法从_skill_states.json读每用户启用状态。

返回按技能名做键的字典。

每个值是{"enabled": True/False}。

文件不存在时返回空字典。

## 三、它和谁协作

- LocalSkillStorage是它的基类。
- get_paths解析用户路径。
- skills/permissions让技能写入的路径沙箱可读。
- update_skill写入每用户状态。

## 四、重要性评级

评级是7分。

理由如下。

这个类是多用户技能隔离的关键。

同名自定义技能的跨用户串扰靠它防。

LEGACY回退保留迁移兼容。

shadow-mount语义被明确记录。

每用户状态文件防止PUBLIC状态误用。

但它是基类的具体化加用户路径。

扣掉3分。

扣分原因是核心流程仍在基类。
