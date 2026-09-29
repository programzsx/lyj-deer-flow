# _LinkedDirectory档案

源码位置：backend/packages/harness/deerflow/skills/export.py

## 一、这个类是干什么的

_LinkedDirectory是一个内部异常。

导出绝不能跟随符号链接。符号链接可能指向技能目录之外。跟随链接会泄露主机文件。_open_directory_chain逐级打开目录时发现链接就抛这个异常。

_LinkedDirectory继承Exception。_LinkedDirectory是空异常。_LinkedDirectory是控制流信号。信号表示目录链里有链接。

## 二、类的成员

_LinkedDirectory没有自定义字段。_LinkedDirectory没有自定义方法。

## 三、它和谁协作

（一）抛出者

_open_directory_chain逐级打开路径组件。每级用os.stat加follow_symlinks=False检查。发现链接抛_LinkedDirectory。

（二）消费者

_capture捕获它。捕获后导出不失败。导出返回一个link阻断项。阻断项说链接的技能目录不能导出。

（三）配合机制

打开链还用O_NOFOLLOW标志。Windows的隐藏属性也算链接。_link函数同时检查st_mode和st_file_attributes的0x400位。

## 四、重要性评级

评级：3分。

理由：_LinkedDirectory是导出安全的关键信号。它让符号链接目录被温和拒绝而不是被跟随。异常本身是空的。给3分。
