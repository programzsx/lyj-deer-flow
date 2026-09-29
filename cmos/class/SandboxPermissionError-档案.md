# SandboxPermissionError档案

源码位置：backend/packages/harness/deerflow/sandbox/exceptions.py

## 一、这个类是干什么的

SandboxPermissionError是一个沙箱异常类。

SandboxPermissionError表示文件操作中发生权限错误。

SandboxPermissionError继承SandboxFileError。SandboxFileError继承SandboxError。所以它同时是文件错误和沙箱错误。

## 二、类的成员

SandboxPermissionError没有自定义字段。SandboxPermissionError没有自定义方法。它继承SandboxFileError的path和operation字段。

## 三、它和谁协作

（一）产生者

沙箱实现的文件操作路径抛它。路径遍历检测或路径超出允许的虚拟前缀时抛。download_file的契约里明确写了PermissionError。

（二）消费者

工具层捕获它。把错误转成ToolMessage。

## 四、重要性评级

评级：2分。

理由：SandboxPermissionError只是文件错误下的一个分类。它没有自己的逻辑。它靠类型区分权限问题和普通文件失败。给2分。
