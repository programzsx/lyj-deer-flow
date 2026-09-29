# 模块档案：deerflow.community.opensandbox.sandbox

## 一、这个模块是干什么的

这个模块定义OpenSandboxSandbox类。
OpenSandboxSandbox是DeerFlow沙箱契约的适配器。
它的底层是OpenSandbox的同步SDK客户端。
就是opensandbox.sync.SandboxSync实例。
这个适配器把DeerFlow的Sandbox操作翻译成OpenSandbox的调用。
命令执行用sandbox.commands.run。
文件操作用sandbox.files。
目录和内容搜索靠在沙箱里跑find和grep命令。
解析结果用共享的deerflow.sandbox.search辅助模块。
这和e2b、boxlite、tenki的适配器是同一个路数。

## 二、模块里的主要成员

（1）OpenSandboxSandbox类
这个类继承自deerflow.sandbox.sandbox.Sandbox。
构造参数有id、sandbox、run_command_opts_cls、default_env、sandbox_timeout、default_command_timeout、on_terminal_failure。
sandbox_timeout不能是0或负数。
default_command_timeout必须是正数。
类属性persistent_shell_sessions是False。
每次调用都是一次全新的run_command执行。
shell状态不保留。

（2）终态错误识别
_is_terminal_failure判断一个SDK失败是否意味着远程沙箱不可用。
它沿异常链扫描。
异常链是异常加它的显式cause。
用seen集合防死循环。
内置的BrokenPipeError、ConnectionError、EOFError按isinstance判断。
SandboxUnhealthyException按类名判断。
状态码410算终态。
命令路径的404也算终态。
文件API的404不算。
因为404在文件操作里可能是普通的路径不存在。
所以只有命令操作选择加入404即终态。
_exception_chain是遍历异常链的辅助函数。

（3）续期与命令执行
renew刷新远程沙箱的服务端生命周期。
renew设置绝对过期时间。
不是取最大值。
renew和操作共享一个操作锁。
防止后面的短文件操作缩短长命令的有效期。
_run执行命令。
续期和命令在同一个锁下。
sandbox_timeout续到至少命令超时加30秒宽限。
命令路径失败后调用on_terminal_failure回调。
execute_command返回合并输出。
退出码非零保留在输出文本里。
没有退出码时返回错误。
（4）文件操作
read_file读文件。
支持行号截取。
行号做钳制。
write_file支持追加。
OpenSandbox的写流没有追加模式。
所以做读改写。
文件不存在时从空开始。
追加的读改写在_append_lock下串行化。
防止两个并发追加互相覆盖。
update_file写字节内容。
download_file有100MB上限。
用流式读取。
逐块累计字节。
超限立刻报错。
最后关闭流。

（5）路径安全
_resolve_path要求非空字符串。
反斜杠转正斜杠。
拒绝..穿越。
路径必须绝对。
_resolve_download_path还要求路径在/mnt/user-data虚拟前缀之下。
（6）搜索操作
list_dir、glob、grep用find和grep命令。
命令用共享的remote_search辅助函数构造。
glob和grep的多看一条上限规则和其他适配器一致。
grep的--include和-m标志在BusyBox缺失时降级重试。
主grep状态为2时用降级版本重试。
其他状态保留。
缺grep的127不被误报成无匹配。

## 三、它和谁协作

这个模块依赖谁。
依赖deerflow.sandbox的共享搜索辅助模块。
依赖VIRTUAL_PATH_PREFIX。
opensandbox SDK只在TYPE_CHECKING导入。

谁调用这个模块。
同目录的provider.py调用它。
provider负责创建和销毁OpenSandboxSandbox。
on_terminal_failure回调指向provider的失效方法。

## 四、重要性评级

评级：5分。
理由：这是OpenSandbox后端的适配器核心。它处理了异常链识别、续期锁、追加串行化、BusyBox降级等真实细节。路径安全和下载上限都有。它的结构和其他三个沙箱适配器同源，容易理解。但它是可选集成。给5分。
