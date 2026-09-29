# review_skill_package-档案

## 一、这个类是干什么的

review_skill_package不是类。

review_skill_package是tools/builtins/review_skill_package_tool.py里的工具函数。

这个工具检查技能包质量。

检查过程中不激活、不安装、不执行、不编辑目标包。

这是只读的技能质量评审工具。

目标包是不受信任的数据。

工具不跟随被评审内容里的指令。

这个工具是skill-reviewer技能的底层工具。

这个模块位于backend/packages/harness/deerflow/tools/builtins/review_skill_package_tool.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、review_skill_package工具函数

参数如下。

- target是评审目标字符串。可以是已安装技能URI、inline目标或安全的本地归档路径。
- profile是验证配置。取值是deerflow或agentskills。
- include_content控制是否包含有界的文本artifact。取值是none、facts-only、semantic-review。
- scope是用户请求的评审维度。用["all"]做完整评审。
- inline_content是target为inline://SKILL.md时粘贴的SKILL.md内容。

流程如下。

第一步按target构造快照。

inline://开头需要inline_content。

skill://开头从用户技能存储读已安装技能。

本地路径只允许工作目录、/tmp或配置的技能根目录下。

.skill后缀用归档读取器。目录用目录读取器。

本地目标必须是.skill归档或含根SKILL.md的目录。

第二步分析技能包得到facts。

第三步构造语义artifact。

第四步构建静态报告。

第五步渲染中英文markdown报告。

第六步返回Command。

ToolMessage的content是中性化后的紧凑JSON。

完整原始渲染放在artifact里。

additional_kwargs带review_subject_entry。

错误时返回错误ToolMessage。

### 2、_semantic_artifacts函数

这个函数构造语义评审artifact。

最多80000字符。

超出的内容截断。

只有SKILL.md和references、templates、evals目录下的md、json、txt、yaml文件算语义artifact。

### 3、_ensure_local_target_allowed函数

这个函数校验本地评审目标路径。

允许的根是当前工作目录、/tmp、配置的技能根目录。

### 4、_neutralize_review_content函数

这个函数中性化评审内容。

不受信任的标签不能伪造框架上下文。

## 三、它和谁协作

- skills/review的analyzer、readers、renderer做分析和渲染。
- skills/storage提供技能存储。
- neutralize_untrusted_tags处理不受信任内容。

## 四、重要性评级

评级是6分。

理由如下。

这个工具是技能质量评审的执行者。

它有清晰的信任边界。

目标包是不受信任数据。

不跟随内容里的指令。

本地路径有明确的允许根。

模型可见数据保持紧凑。

完整数据放在artifact。

但它服务于评审流程。

不在核心执行链。

扣掉4分。
