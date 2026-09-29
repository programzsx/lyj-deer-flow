# deerflow.skills.types-档案

## 一、这个模块是干什么的

这个模块定义技能系统的核心数据类型。

技能是DeerFlow里的一种扩展方式。一个技能是一个目录。目录里放一个SKILL.md文件。SKILL.md用YAML frontmatter描述这个技能的名字、说明、许可证等信息。

这个模块不解析文件。这个模块只定义"一个技能长什么样"。具体解析工作在parser模块里。

## 二、模块里的主要成员

### 1、SkillCategory枚举

SkillCategory表示技能的来源类别。SkillCategory有四个取值。

- PUBLIC。PUBLIC表示平台自带的内置技能。内置技能是只读的。
- CUSTOM。CUSTOM表示用户自己编写的技能。CUSTOM技能可以编辑、可以删除。
- INTEGRATION。INTEGRATION表示托管的第三方集成技能。INTEGRATION技能是只读的。
- LEGACY。LEGACY表示用户隔离迁移之前的全局自定义技能。LEGACY技能显示为只读。LEGACY技能在沙箱里挂在/mnt/skills/legacy/<名字>/路径下。

### 2、SecretRequirement数据类

SecretRequirement表示一个技能声明它需要的请求级密钥。name字段有两个用途。

name是查找密钥用的键。调用方在请求的context.secrets里按这个名字提供值。

name也是环境变量的名字。技能激活时。这个名字会作为环境变量注入技能的沙箱子进程。

optional字段表示这个密钥是不是可选的。

### 3、Skill数据类

Skill是核心。Skill用frozen dataclass定义。Skill承载一个技能的全部元数据。

主要字段如下。

- name。name是技能名。
- description。description是技能说明。
- license。license是许可证文本。
- skill_dir。skill_dir是技能目录路径。
- skill_file。skill_file是SKILL.md文件路径。
- relative_path。relative_path是相对类别根目录的路径。
- category。category是SkillCategory类别。
- allowed_tools。allowed_tools是技能声明允许使用的工具名元组。None表示不限制。
- enabled。enabled表示技能是否启用。
- required_secrets。required_secrets是SecretRequirement元组。
- secrets_autonomous。secrets_autonomous控制声明的密钥能否在技能被自主加载进上下文时绑定。默认True。对应frontmatter的secrets-autonomous字段。

Skill还有三个方法。

skill_path属性返回相对路径的posix字符串形式。路径是"."时返回空字符串。

get_container_path返回技能在容器里的完整目录路径。容器基路径默认是DEFAULT_SKILLS_CONTAINER_PATH。

get_container_file_path返回SKILL.md在容器里的完整文件路径。就是在容器目录路径后拼上/SKILL.md。

## 三、它和谁协作

types是技能系统的地基。

parser模块把SKILL.md解析成Skill对象。

catalog模块用Skill对象做搜索索引。

projection模块用Skill对象决定往沙箱视图里投影哪些技能。

executor和技能策略中间件读取Skill的allowed_tools和required_secrets。

types只依赖deerflow.constants里的容器路径常量。types不依赖其他技能模块。所以types不会造成循环导入。

## 四、重要性评级

评级是8分（满分10分）。

理由：

Skill数据类是整个技能系统的通用语言。所有技能模块都围绕Skill运转。没有types，技能系统没有数据形状。

SecretRequirement承载了请求级密钥功能的声明端。name的双重用途（查找键加环境变量名）是安全契约的一部分。

评级不给满分的原因是types本身没有逻辑。types只是数据定义。复杂度低。但是不可替代。
