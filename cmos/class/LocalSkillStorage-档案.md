# LocalSkillStorage-档案

## 一、这个类是干什么的

LocalSkillStorage是skills/storage/local_skill_storage.py里的类。

它是SkillStorage的本地文件系统实现。

它实现所有抽象的存储操作。

布局如下。

- <root>/public/<name>/SKILL.md是公开技能。
- <root>/custom/<name>/SKILL.md是自定义技能。
- <root>/custom/.history/<name>.jsonl是历史。

这个类位于backend/packages/harness/deerflow/skills/storage/local_skill_storage.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、构造方法

构造方法接受host_path、container_path、app_config。

host_path为None时从app config解析技能路径。

host_path给出时直接解析路径。

这个构造形式给测试和非用户级存储用。

app_config保留原样可能是None。

急切调用get_app_config()会破坏无配置环境。

例如CI。

skill_scan.enabled开关在扫描时惰性解析。

None被尊重而不是被忽略。

### 2、_iter_skill_files方法

这个方法对每个SKILL.md产出条目。

含SKILL.md的目录是包边界。

嵌套的SKILL.md文件属于那个包的支持资源。

例如eval fixture。

不属于运行时技能注册表。

没有SKILL.md的命名空间目录继续递归。

保留public/team/helper这样的布局。

### 3、存储操作

- custom_skill_exists检查自定义技能文件存在。
- public_skill_exists检查公开技能存在。
- read_custom_skill读SKILL.md。
- write_custom_skill原子写文本文件。
- delete_custom_skill删除技能。
- append_history和read_history处理JSONL历史。
- ainstall_skill_from_archive安装归档。

### 4、临时目录清理超时

_INSTALL_TMP_CLEANUP_TIMEOUT_SECONDS是5秒。

这是尽力而为的临时目录清理上限。

停顿的文件系统（例如NFS）不能阻碍安装结果从finally块传播出去。

## 三、它和谁协作

- SkillStorage是它的基类。
- UserScopedSkillStorage继承它。
- walk_skill_directories提供目录遍历。
- skills/installer处理归档安装。

## 四、重要性评级

评级是6分。

理由如下。

这个类是技能存储的默认实现。

所有部署默认走它。

包边界规则防止嵌套SKILL.md污染注册表。

配置free环境的兼容处理有细节。

但它是基类的具体化。

核心流程在基类。

扣掉4分。
