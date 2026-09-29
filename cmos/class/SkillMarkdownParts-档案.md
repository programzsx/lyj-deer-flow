# SkillMarkdownParts档案

源码位置：backend/packages/harness/deerflow/skills/frontmatter.py

## 一、这个类是干什么的

SkillMarkdownParts是SKILL.md文档解析后的分块。

SKILL.md由两部分组成。头部是YAML frontmatter。后面是正文。解析把两部分拆开。

SkillMarkdownParts是frozen dataclass。SkillMarkdownParts装着拆开后的三块。

## 二、类的成员

（一）字段

- metadata：frontmatter解析成的字典。键统一转成字符串。
- frontmatter_text：frontmatter的原始文本。
- body：正文文本。

## 三、它和谁协作

（一）产生者

split_skill_markdown函数产出SkillMarkdownParts。函数用_FRONTMATTER_RE正则匹配。正则容忍UTF-8 BOM。BOM来自Windows的Set-Content命令。BOM被正则消耗。frontmatter和正文都不会带着BOM往下走。frontmatter用yaml.safe_load解析。解析结果必须是字典。YAML允许非字符串键。代码把键统一转成字符串。

（二）返回形态

split_skill_markdown返回二元组。成功返回（parts, None）。失败返回（None, 消息）。消息故意不带主机路径。消息可以被确定性行评审复用。

（三）消费者

export.py的_manifest读parts.metadata提取compatibility、allowed-tools、required-secrets。技能加载流程用parts分块处理。

## 四、重要性评级

评级：5分。

理由：SkillMarkdownParts是SKILL.md解析的标准产物。frontmatter是技能全部安全声明的来源。键归一化和BOM处理让下游不用操心格式差异。它是三字段的frozen dataclass。给5分。
