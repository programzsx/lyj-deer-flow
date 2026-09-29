# deerflow.skills.review.cli-档案

## 一、这个模块是干什么的

这个文件是确定性技能审查的CLI入口。

它用python -m deerflow.skills.review.cli运行。

它分析一个技能包。不执行它。

它输出JSON或文本格式的事实。

它支持按严重性失败。CI用它做技能质量门槛。

## 二、模块里的主要成员

### 1、main函数

这是CLI入口。

它接收命令行参数。

参数有这些。

target是要审查的技能目录或.skill归档。

profile是分析档位。deerflow或agentskills。默认deerflow。

format是输出格式。json或text。默认json。

fail-on是失败阈值。never、warning、error、blocker。默认never。发现达到这个严重性或更糟时退出非零。

fail-on-incomplete是完整性失败开关。包内容未被评估时退出非零。

max-files、max-file-bytes、max-total-bytes是限制参数。默认值来自DEFAULT_PACKAGE_LIMITS。

处理流程是这样的。

构建限制。

按target的后缀选读取器。后缀是.skill用ArchivePackageReader。否则用LocalDirectoryReader。

读取快照。

分析。analyze_skill_package。

输出。json格式输出稳定的JSON。text格式输出人可读文本。

返回退出码。

### 2、_print_text函数

这个函数输出人可读文本。

输出主题、摘要、完整性。

逐条输出发现。格式是严重性加规则id加位置加消息。

### 3、_exit_code函数

这个函数计算退出码。

fail-on-incomplete为True且完整性有未评估内容时返回1。

fail-on是never时返回0。

其他时遍历发现。严重性排序值小于等于阈值时返回1。

没有匹配的发现返回0。

CI应该用--fail-on error --fail-on-incomplete运行。这样blocker和error发现以及截断或未评估的包都会让门槛失败。

## 三、它和谁协作

它依赖review包的analyzer、models、readers。

它被CI调用。scripts/review_changed_public_skills.py驱动它。

它被开发者手动调用。

它是审查包的命令行出口。

## 四、重要性评级

评级是5分。

理由是这个文件是技能审查的CI门槛入口。

退出码的语义支撑了自动质量门。

fail-on加fail-on-incomplete的组合让blocker、error发现和未评估内容都失败。

不评更高分是因为它是薄的CLI包装。真正的分析在analyzer里。读取在readers里。
