# PackageLimits档案

源码位置：backend/packages/harness/deerflow/skills/review/models.py

## 一、这个类是干什么的

PackageLimits是技能包评审的资源上限。

评审要读取技能包的全部文件。读取必须有上限。没有上限的读取是资源耗尽向量。PackageLimits声明了三个上限。

PackageLimits是frozen dataclass。模块级还有DEFAULT_PACKAGE_LIMITS默认实例。

## 二、类的成员

（一）字段

- max_files：文件数上限。默认4096。
- max_file_bytes：单文件字节上限。默认64MiB。
- max_total_bytes：总字节上限。默认512MiB。

（二）方法

- to_dict：把三个上限转成字典。字典用于评审快照的limits段。

## 三、它和谁协作

（一）读取器

LocalDirectoryReader用limits约束目录遍历。超限置truncated并记录reader_errors。ArchivePackageReader用limits约束zip成员读取。Declared_size先查上限。实际读取也按剩余预算分块。

（二）快照

评审快照记录limits。评审结果可复现。上限是评审确定性的一部分。

## 四、重要性评级

评级：4分。

理由：PackageLimits是评审读取的资源边界。三个上限防止文件数、单文件、总大小三种耗尽。它是读取器共享的配置单元。给4分。
