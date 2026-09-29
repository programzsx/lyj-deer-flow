# SandboxFileError档案

源码位置：backend/packages/harness/deerflow/sandbox/exceptions.py

## 一、这个类是干什么的

SandboxFileError是一个沙箱异常类。

SandboxFileError表示文件操作在沙箱里失败。

SandboxFileError继承SandboxError。details里带路径和操作名。

SandboxFileError还是两个子类的父类。SandboxPermissionError继承它。SandboxFileNotFoundError继承它。

## 二、类的成员

（一）字段

- path：失败的文件路径。默认None。
- operation：失败的操作名。默认None。

## 三、它和谁协作

（一）产生者

沙箱实现的文件操作路径抛它。读写文件失败时抛。

（二）消费者

工具层捕获它。按类型转成ToolMessage。

## 四、重要性评级

评级：2分。

理由：SandboxFileError是文件失败的分类信号。它带路径和操作名两个细节。它还是权限错误和文件缺失错误的父类。给2分。
