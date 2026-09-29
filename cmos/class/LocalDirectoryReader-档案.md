# LocalDirectoryReader档案

源码位置：backend/packages/harness/deerflow/skills/review/readers.py

## 一、这个类是干什么的

LocalDirectoryReader是本地技能目录的读取器。

技能质量评审需要读技能包。读取产出快照。快照装着文件列表、错误列表、截断标记。LocalDirectoryReader读本地目录。读取不跟随符号链接逃逸。

## 二、类的成员

（一）字段

- root：技能目录根路径。
- limits：评审上限。PackageLimits。默认DEFAULT_PACKAGE_LIMITS。
- subject：评审主体。主体记录来源、显示引用、名字提示。

（二）方法

- read：读取目录。产出评审快照。流程是这样的。先检查根存在。再检查根是目录。再用os.walk加followlinks=False遍历。目录符号链接被剔除并记录为symlink条目。文件按路径排序。文件数超过max_files时置truncated并返回。总字节超过max_total_bytes时置truncated并返回。单文件超过max_file_bytes时记为binary条目。文本文件解码后带内容。每个文件带sha256。
- _sort_snapshot：静态方法。文件和错误按路径排序。排序让快照确定性。

## 三、它和谁协作

（一）models

PackageLimits提供上限。normalize_relative_path归一化相对路径并拒绝逃逸。stable_json_dumps做字节稳定的序列化。

（二）子类

InstalledSkillReader继承LocalDirectoryReader。子类只改根路径解析和subject来源。

（三）消费者

review_skill_package工具用读取器产出快照。快照供评审规则扫描。

## 四、重要性评级

评级：6分。

理由：LocalDirectoryReader是评审数据面的基础。它把不可信技能目录变成确定性的评审快照。符号链接剔除、路径归一化、三重上限、排序保证快照安全且可复现。它是评审三个读取器的基类。给6分。
