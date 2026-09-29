# deerflow.skills.review.analyzer-档案

## 一、这个模块是干什么的

这个文件是确定性的技能包分析器。

它接收一份PackageSnapshot。输出review-facts.v1。

分析是确定性的。不用LLM。同样的输入永远得到同样的输出。

它检查的东西有这些。

结构检查。根目录有没有SKILL.md。SKILL.md是不是UTF-8文本。有没有嵌套的SKILL.md。

frontmatter检查。格式对不对。字段有没有未知项。name是不是hyphen-case。description有没有。是不是太长。body是不是空。allowed-tools和required-secrets的格式对不对。

包检查。符号链接条目。嵌套归档。隐藏的敏感文件。

资源图检查。引用的文件存不存在。有没有孤儿资源。

eval清单检查。

SkillScan扫描。

## 二、模块里的主要成员

### 1、analyze_skill_package主函数

这是分析入口。

它接收snapshot字典和profile。

处理流程分几步。

第一步。找SKILL.md。根目录没有时报blocker。不是文本时报blocker。有就分析frontmatter。

第二步。嵌套的SKILL.md报blocker。eval fixture的SKILL.md除外。eval fixture是刻意不安全的审查样本。

第三步。逐文件检查符号链接、嵌套归档、隐藏敏感文件。各报warning。

第四步。构建资源图。合并资源发现。

第五步。分析eval清单。合并eval发现。

第六步。SkillScan扫描。失败时记录analyzer_error。skillscan标记为未评估。

第七步。快照截断时full_package标记为未评估。

第八步。排序发现。计算包摘要。返回facts字典。

facts包括schema_version、subject、profile、completeness、summary、findings、resources、evals、reader_errors、analyzer_errors。

### 2、_analyze_skill_md函数

这个函数分析SKILL.md的frontmatter。

它检查这些。

frontmatter格式。无效时报blocker。

未知字段。报warning。

name。缺失报blocker。不是hyphen-case报error。超过64字符报error。

description。缺失报blocker。超过1024字符报error。

body。空时报error。

allowed-tools。解析失败报error。

required-secrets。解析失败报error。optional字段不是布尔报error。

secrets-autonomous。不是布尔报error。

profile是agentskills时附加可移植性建议。描述超过200字符报warning。名字超过64字符报warning。

### 3、_scan_with_skillscan函数

这个函数跑SkillScan扫描。

它把快照的全部非符号链接文件物化到临时目录。二进制条目用content_base64解码。

物化用独占创建。open用xb模式。重复的归档成员或case折叠的名字会让扫描fail closed。标记为未评估。而不是覆盖之前的文件。

只有eval fixture的SKILL.md被扣下。其他文件包括二进制和fixture脚本逐字节扫描。

临时目录用完即删。

### 4、_snapshot_entry_bytes函数

这个函数提取快照条目的字节。

text条目用content编码。其他条目用content_base64解码。

超大的条目没有字节。截断已经标记审查不完整。其他没字节的条目抛ValueError。不静默跳过扫描。

### 5、辅助函数

_valid_skill_name验证hyphen-case名字。全匹配。不超过64字符。

_is_nested_archive检查嵌套归档扩展名。zip、tar、7z、rar、whl这些。

_is_hidden_sensitive_path检查隐藏敏感路径。.env、.npmrc、.pypirc、.netrc。

## 三、它和谁协作

它依赖deerflow.skills的frontmatter、parser、package_paths。

它依赖review包的digest、eval_schema、models、resource_graph。

它依赖skills.skillscan的scan_skill_dir。

它被review_skill_package内置工具调用。

它被review的cli调用。

它不导入app。不执行目标脚本。不装依赖。不调网络。

## 四、重要性评级

评级是8分。

理由是这个文件是技能审查的核心分析器。

全部确定性规则都集中在这里。结构、frontmatter、包、资源、eval。

SkillScan的物化用独占创建。这是安全关键的。覆盖会隐藏文件。

二进制条目逐字节扫描让包规则覆盖二进制。

不评更高分是因为它是只读分析。不执行目标代码。
