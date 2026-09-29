# SandboxFileNotFoundError档案

源码位置：backend/packages/harness/deerflow/sandbox/exceptions.py

## 一、这个类是干什么的

SandboxFileNotFoundError是一个沙箱异常类。

SandboxFileNotFoundError表示文件或目录没找到。

SandboxFileNotFoundError继承SandboxFileError。SandboxFileError继承SandboxError。所以它同时是文件错误和沙箱错误。

## 二、类的成员

SandboxFileNotFoundError没有自定义字段。SandboxFileNotFoundError没有自定义方法。它继承SandboxFileError的path和operation字段。

## 三、它和谁协作

（一）产生者

沙箱实现的文件操作路径抛它。读的文件不存在时抛。

（二）消费者

工具层捕获它。把错误转成ToolMessage。

## 四、重要性评级

评级：2分。

理由：SandboxFileNotFoundError只是文件错误下的一个分类。它没有自己的逻辑。它靠类型区分文件缺失和普通文件失败。给2分。
