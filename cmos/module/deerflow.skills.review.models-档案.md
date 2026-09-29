# deerflow.skills.review.models-档案

## 一、这个模块是干什么的

这个文件是技能审查的共享契约和确定性辅助模块。

它定义版本常量、严重性级别、限制、路径规范化、发现构建、排序、汇总。

它是审查包的基础模块。其他模块全依赖它。

## 二、模块里的主要成员

### 1、版本常量

PACKAGE_SNAPSHOT_SCHEMA_VERSION是快照的schema版本。值是deerflow.skill-package-snapshot.v1。

FACTS_SCHEMA_VERSION是审查事实的schema版本。值是deerflow.skill-review.facts.v1。

REPORT_SCHEMA_VERSION是报告的schema版本。值是deerflow.skill-review.report.v1。

### 2、严重性级别

Severity是严重性的Literal类型。四级。blocker、error、warning、info。

SEVERITY_RANK是严重性到排序值的映射。blocker是0。error是1。warning是2。info是3。

SKILLSCAN_SEVERITY_MAP是SkillScan严重性到审查严重性的映射。CRITICAL映射blocker。HIGH映射error。MEDIUM映射warning。LOW映射info。

ProfileName是分析器档位的Literal类型。deerflow和agentskills两个。

### 3、PackageLimits数据类

这是包审查的限制。

三个限制。max_files最多文件数。默认4096。max_file_bytes单文件最大字节。默认64MB。max_total_bytes总字节上限。默认512MB。

to_dict返回字典。

DEFAULT_PACKAGE_LIMITS是默认限制实例。

### 4、stable_json_dumps函数

这个函数序列化审查数据。字节稳定。路径无关。

sort_keys是True。分隔符紧凑。ensure_ascii是False。

同样的数据永远得到同样的字节。摘要计算靠这个。

### 5、normalize_relative_path函数

这个函数规范化包相对路径。拒绝逃逸尝试。

处理规则是这样的。

反斜杠转成正斜杠。去空白。

空路径抛ValueError。

绝对路径抛ValueError。

normpath后是根或点的抛ValueError。

包含..的抛ValueError。

返回规范化后的路径。

### 6、make_finding函数

这个函数构建一条发现。

参数有rule_id规则id、severity严重性、message消息、remediation修复建议。

可选参数有source来源、profile档位、path路径、line行号、evidence证据、extra附加字段。

source默认review-core。profile默认deerflow。

返回字典。extra会合并进去。

### 7、sort_findings函数

这个函数排序发现。

排序键是严重性、路径、行号、规则id、消息。

严重性缺省映射到99。排最后。

行号缺失时用10的9次方。排后面。

### 8、summarize_findings函数

这个函数汇总发现。

返回blockers、errors、warnings、infos四个计数。

## 三、它和谁协作

它被review包的全部模块引用。analyzer、readers、digest、renderer、cli、eval_schema、resource_graph。

它被contracts/skill_review的JSON契约锚定。

它不依赖任何deerflow模块。只用标准库。

## 四、重要性评级

评级是6分。

理由是这个文件是审查体系的词汇表和工具集。

严重性级别、排序规则、路径规范化、发现结构全部定义在这里。

normalize_relative_path的逃逸拒绝是安全规则。readers和digest都用它。

stable_json_dumps的字节稳定性是摘要计算的前提。

不评更高分是因为它没有业务决策。只有定义和纯工具。
