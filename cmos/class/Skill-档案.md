# Skill档案

源码位置：backend/packages/harness/deerflow/skills/types.py

## 一、这个类是干什么的

Skill是技能的核心表示。

一个技能就是一个SKILL.md加一批辅助文件。Skill把这个技能的元数据和路径装在一起。

Skill是frozen dataclass。Skill创建后不能修改。

整个技能系统围绕这个类运转。目录扫描产出Skill。目录检索用Skill。斜杠命令解析用Skill。工具策略过滤也用Skill。

## 二、类的成员

（一）字段

- name：技能名。名字是小写加连字符的形式。
- description：技能描述。描述用于目录检索。
- license：许可证。可以为None。
- skill_dir：技能目录的磁盘路径。
- skill_file：SKILL.md的磁盘路径。
- relative_path：从类别根到技能目录的相对路径。
- category：来源类别。取值是SkillCategory。
- allowed_tools：技能声明的工具白名单。None表示未声明。空元组表示显式禁用所有业务工具。
- enabled：技能是否启用。默认False。
- required_secrets：技能声明的密钥需求。每个元素是SecretRequirement。
- secrets_autonomous：声明的密钥是否可以在模型自主加载技能时绑定。默认True。

（二）方法

- skill_path：属性。返回从类别根到技能目录的相对路径字符串。
- get_container_path：返回技能在容器里的目录路径。基础路径默认是/mnt/skills。
- get_container_file_path：返回技能的SKILL.md在容器里的完整路径。

## 三、它和谁协作

（一）产生者

技能存储扫描磁盘后构造Skill。frontmatter解析提供name、description、allowed_tools、required_secrets。

（二）消费者

SkillCatalog把Skill装进检索索引。slash.py把文本解析成ResolvedSlashSkill时持有Skill。tool_policy.py按allowed_tools过滤工具。describe.py渲染Skill的元数据给模型看。

## 四、重要性评级

评级：8分。

理由：Skill是技能系统的中心数据结构。发现、检索、激活、工具过滤全部围绕这个类。它承载了allowed_tools和required_secrets这两个安全声明。没有它技能系统无法运转。它是frozen dataclass。给8分。
