# SandboxCommandError档案

源码位置：backend/packages/harness/deerflow/sandbox/exceptions.py

## 一、这个类是干什么的

SandboxCommandError是一个沙箱异常类。

SandboxCommandError表示命令在沙箱里执行失败。

SandboxCommandError继承SandboxError。details里带命令和退出码。

命令会截断。details里的命令超过100字符就截断加省略号。这样错误消息不会因为一条超长命令而爆炸。

## 二、类的成员

（一）字段

- command：失败的命令。默认None。
- exit_code：退出码。默认None。

## 三、它和谁协作

（一）产生者

沙箱实现的命令执行路径抛它。命令失败时抛。

（二）消费者

工具层捕获它。把错误转成ToolMessage给模型看。

## 四、重要性评级

评级：2分。

理由：SandboxCommandError是命令失败的分类信号。它带命令和退出码两个细节。但它只是分类异常，没有复杂逻辑。给2分。
