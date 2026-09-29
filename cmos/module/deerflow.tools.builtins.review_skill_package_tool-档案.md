# deerflow.tools.builtins.review_skill_package_tool-档案

## 一、这个模块是干什么的

这个文件提供内置的非激活技能包审查工具。

工具名字是review_skill_package。

这个工具检查一个技能包。

检查不激活、不安装、不执行、不编辑。

目标包是不可信数据。

被审查内容里的指令不能被执行。

这个工具服务于技能审查工作流。

skills/public/skill-reviewer/技能使用它。

## 二、模块里的主要成员

### 1、review_skill_package工具

工具接受target和几个选项。

target是审查目标字符串。

target支持三种形式。

inline://开头的审查内联SKILL.md内容。

skill://开头的审查已安装技能。

其他是本地路径或.skill归档。

profile是校验配置，默认deerflow，支持agentskills。

include_content控制是否带文本工件。

scope是审查维度，默认全部。

#### （1）目标快照

_snapshot_for_target为不同目标构建快照。

内联目标用build_inline_snapshot。

已安装技能走InstalledSkillReader。

.skill归档走ArchivePackageReader。

目录走LocalDirectoryReader。

#### （2）本地目标防护

_ensure_local_target_allowed限制本地审查目标。

目标必须在当前工作区、/tmp、或配置的技能根目录下。

_ensure_local_target_is_package_or_archive进一步限制。

目标必须是.skill归档或含根SKILL.md的目录。

#### （3）分析流程

流程有这些步骤。

第一步构建快照。

第二步用analyze_skill_package分析事实。

第三步构建语义工件。

第四步构建静态报告。

第五步渲染中英文markdown报告。

#### （4）结果结构

结果payload带untrusted_review_data标记。

标记提醒下游内容不可信。

payload包含facts、artifacts、static_report、中英文markdown。

完整原始渲染放在artifact里。

模型可见的内容保持紧凑。

content经过标签中和。

中和让审查内容无法伪造框架标记。

#### （5）语义工件

_semantic_artifacts收集SKILL.md和参考文档的文本。

包括references、templates、evals下的markdown、json、txt、yaml。

工件有字符预算，默认80000字符。

超预算的内容被截断并标记。

### 2、错误处理

任何异常返回错误ToolMessage。

错误状态通过Command返回。

## 三、它和谁协作

它依赖deerflow.skills.review的分析器、读取器、渲染器。

它依赖deerflow.skills.storage的技能存储。

它依赖deerflow.agents.middlewares的标签中和。

它被tools.py加入BUILTIN_TOOLS。

它被skill-reviewer技能调用。

## 四、重要性评级

评级是6分。

理由是这个文件是技能质量审查的执行入口。

审查流程强制非激活边界。

审查对象是不可信数据。

内容中和和字符预算挡住了提示注入。

不评高分的原因是审查是专门工作流。

普通对话用不到它。
