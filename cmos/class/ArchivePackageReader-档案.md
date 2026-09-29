# ArchivePackageReader档案

源码位置：backend/packages/harness/deerflow/skills/review/readers.py

## 一、这个类是干什么的

ArchivePackageReader是.skill压缩包的检查器。

评审一个技能包可以不安装。ArchivePackageReader直接读zip归档。检查不落盘。检查产出评审快照。

## 二、类的成员

（一）字段

- archive_path：归档路径。
- limits：评审上限。PackageLimits。默认DEFAULT_PACKAGE_LIMITS。

（二）方法

- read：读取归档。产出评审快照。流程是这样的。先打开zip。再按文件名排序成员。成员数超上限时置truncated并截断成员列表。每个成员先归一化路径。归一化失败的进reader_errors。声明大小超上限的记binary条目。实际读取用_read_zip_member_bounded分块。实际大小也受总预算约束。zip符号链接成员读出目标并记symlink条目。其余成员按普通文件记条目。
- _normalize_archive_name：静态方法。归一化归档成员名。失败时记invalid_archive_path错误。

（三）配合函数

_read_zip_member_bounded分块读取。读取每块最多1MiB。读取在超过max_bytes时立刻返回并置limit_exceeded。_zip_member_is_symlink读external_attr的高16位判断符号链接。

## 三、它和谁协作

（一）models

normalize_relative_path拒绝绝对路径和父目录逃逸。PackageLimits提供三重上限。

（二）消费者

review流程用它做安装前检查。快照与目录读取器的快照同构。

## 四、重要性评级

评级：6分。

理由：ArchivePackageReader是安装前评审的关键。它让zip包不落盘就能被完整检查。分块读取防zip炸弹。路径归一化防逃逸。它与目录读取器产出同构快照。给6分。
