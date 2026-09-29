# InstalledSkillReader档案

源码位置：backend/packages/harness/deerflow/skills/review/readers.py

## 一、这个类是干什么的

InstalledSkillReader是已安装技能的读取器。

评审的目标可以是一个skill://地址。地址指向已安装的技能。InstalledSkillReader解析地址。解析后定位磁盘目录。定位后复用父类的目录读取。

InstalledSkillReader继承LocalDirectoryReader。读取逻辑全部继承。子类只改地址解析和subject来源。

## 二、类的成员

（一）方法

- from_target：类方法。按skill://地址构造读取器。流程是这样的。先parse_skill_uri解析地址。再_installed_skill_root定位根目录。再构造父类实例。subject记录来源是installed。subject还带category和skill://形式的display_ref。

（二）配合函数

parse_skill_uri解析地址。地址必须是skill://<category>/<相对路径>。category只允许public、custom、legacy三种。相对路径用normalize_relative_path归一化。归一化拒绝逃逸。_installed_skill_root按category定位根目录。custom类别优先用storage的get_user_custom_root。legacy类别落在老的全局custom目录。

## 三、它和谁协作

（一）父类

LocalDirectoryReader提供全部读取逻辑。三重上限、符号链接剔除、排序都继承。

（二）消费者

review_skill_package工具用它评审已安装技能。skill://地址是评审目标的规范身份。

## 四、重要性评级

评级：4分。

理由：InstalledSkillReader把skill://规范身份接到目录读取上。它让已安装技能的评审有统一入口。逻辑全部复用父类。它是薄封装。给4分。
