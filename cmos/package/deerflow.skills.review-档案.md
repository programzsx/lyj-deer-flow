# deerflow.skills.review-档案

## 一、这个包是干什么的

这个包是技能质量评审的核心。

技能发布前需要评审质量。
评审要回答几个问题。

- 包结构对不对。有没有SKILL.md。
- frontmatter合不合法。
- 声明的资源文件存不存在。
- 评估清单合不合规。

这个包做确定性的评审。
不调用LLM。
不执行技能脚本。
不安装依赖。
不访问网络。

它读一个技能包。
产出结构化的事实。
事实遵循review-facts v1 schema。
渲染器把事实变成本地化的Markdown报告。
CLI提供命令行入口。

这个包是只读的。
它不修改被评审的包。

## 二、包里的主要成员

### （一）模块__init__.py——公共出口

导出核心API。

- `analyze_skill_package`。评审分析入口。
- `build_inline_snapshot`。构建内联快照。
- `LocalDirectoryReader`。本地目录读取器。
- `PackageLimits`和`DEFAULT_PACKAGE_LIMITS`。评审限额。
- 三个schema版本常量。
- `stable_json_dumps`。稳定JSON序列化。

### （二）模块models.py——共享契约

定义schema版本。
版本有三个。
PACKAGE_SNAPSHOT_SCHEMA_VERSION是快照schema。
FACTS_SCHEMA_VERSION是事实schema。
REPORT_SCHEMA_VERSION是报告schema。

定义严重级别。
级别有blocker、error、warning、info。
`SEVERITY_RANK`给出排序。
`SKILLSCAN_SEVERITY_MAP`把SkillScan的级别映射过来。

定义`PackageLimits`。
限额约束评审的输入规模。
`DEFAULT_PACKAGE_LIMITS`是默认限额。

`make_finding`构造一条发现。
`sort_findings`排序发现。
`summarize_findings`汇总发现。
`normalize_relative_path`规范相对路径。
`stable_json_dumps`输出稳定JSON。

### （三）模块readers.py——只读包读取器

读取器从两种来源读包。

- `LocalDirectoryReader`。从本地目录读。
- 归档读取器。从.skill ZIP归档读。

`build_inline_snapshot`构建内联快照。
快照遵循package-snapshot v1 schema。
每个文件条目有path、kind、size、sha256。
文本文件带内容。
非符号链接的快照文件带byte-faithful副本。
二进制条目带content_base64。

读取是只读的。
不修改源。

### （四）模块analyzer.py——确定性分析器

`analyze_skill_package`是核心入口。
它从PackageSnapshot产出review-facts v1。

分析分几个维度。

- 结构检查。包根必须有SKILL.md。缺失报blocker。
- frontmatter检查。用共享的frontmatter辅助。检查必填属性和格式。
- allowed-tools检查。解析声明，检查拼写。
- required-secrets检查。解析密钥声明。
- 资源图检查。委托给resource_graph。
- 评估清单检查。委托给eval_schema。
- SkillScan检查。委托给`scan_skill_dir`。

它把每个非符号链接快照文件byte-faithful地交给SkillScan。
二进制条目带content_base64。
所以包规则如`package-executable-binary`能覆盖二进制文件。
只有eval fixture的SKILL.md样本被豁免。
scripts和其他evals/fixtures下的文件仍然被扫描。

它输出findings、analyzer_errors、not_assessed。
not_assessed列出没被评估的维度。

### （五）模块resource_graph.py——资源图检查

`build_resource_graph`检查包内资源引用。

它扫描SKILL.md正文里的资源路径引用。
引用来自代码span和路径token。
资源目录有references、scripts、templates、assets、evals。
它构建节点和边。
节点是包内文件。
边是文件间的引用。

它报告两类问题。

- missing。引用的资源不存在。
- escaping。引用逃出包边界。

### （六）模块eval_schema.py——评估清单检查

`analyze_eval_manifests`检查evals目录下的JSON清单。
它检查schema。
它统计用例数。
它区分正向触发用例和负向触发用例。
清单不合规时产出发现。

### （七）模块digest.py——包摘要

`compute_package_digest`计算包摘要。
摘要与宿主路径无关。
同样内容的包得到同样的摘要。
摘要用SHA-256。
输入是每个文件的kind、path、size、content_digest。

### （八）模块renderer.py——报告渲染

把事实渲染成本地化Markdown报告。
支持en和zh两种语言。
`Readiness`给出三种就绪状态。

- blocked。不可发布。
- revise。需修订。
- publish_candidate。可作为发布候选。

`Assurance`给出四种保障等级。
从static_only到regression_verified。
渲染器按locale选标签。

### （九）模块cli.py——命令行入口

`main`是CLI入口。
调用方式是`python -m deerflow.skills.review.cli`。
参数有target、--profile、--format、--fail-on。

target是技能目录或.skill归档。
profile有deerflow和agentskills两种。
format有json和text两种。
`--fail-on`在发现达到指定严重级别时非零退出。
CI应该用`--fail-on error --fail-on-incomplete`跑这个CLI。
这样blocker/error发现和截断/未评估的包会让门禁失败。

## 三、它和谁协作

上游是`review_skill_package`内置工具。
工具位于tools/builtins/。
工具调用分析器。
工具把结果标注为review_subject_entry。
评审目标不会被激活。
不会绑定required-secrets。
不会应用allowed-tools。

它和SkillScan协作。
分析器把快照交给`scan_skill_dir`。
SkillScan产出静态发现。
严重级别映射到评审级别。

它和契约目录协作。
JSON契约在contracts/skill_review/。
契约让Gateway、CLI、前端共享schema。

它和前端协作。
渲染报告给用户看。

它复用共享的frontmatter辅助。
frontmatter.py是schema来源。
它不重复定义。

边界约束是明确的。
它不导入app.*。
不执行目标脚本。
不安装依赖。
不调用网络。

## 四、重要性评级

评级：7分。

理由如下。

这个包是技能质量门禁的核心。
公共技能的CI评审依赖它。
约12个文件直接引用这个包。

它不是运行时路径。
它在发布前运行。
不在每次运行里执行。
删除它，评审功能消失。
运行时不受影响。

它承载了技能生态的质量保障。
没有确定性评审，低质量或有风险的技能会被发布。

它是只读的。
它没有运行时副作用。
这降低了它故障的影响面。

`review_skill_package`工具是它的主要消费者。
工具体量较小。
评审功能面向技能作者和维护者。
所以给7分。
