# deerflow.sandbox.local.local_sandbox

## 一、这个模块是干什么的

这个模块是本地文件系统沙箱。

背景是这样的。

代理执行命令需要沙箱。

沙箱是隔离的执行环境。

最简单的沙箱就是宿主机本地。

加一层路径映射做隔离。

这个类就是那个实现。

它管什么。

它管命令执行。

管目录列举。

管文件读写。

管搜索。

它还有一个核心设计。

是路径映射。

沙箱里的路径是虚拟的。

比如/mnt/user-data/workspace。

宿主机上的真实路径是按线程隔离的。

路径映射把虚拟路径翻译成宿主路径。

命令里的路径要翻译。

输出里的路径要反向翻译。

这样代理永远看到一致的虚拟路径。

命令执行有很多细节。

有默认的墙钟超时。

超时后命令被终止。

防止代理回合永久挂起。

有输出捕获上限。

超限的输出被截断。

Windows和POSIX的进程终止方式不同。

Windows要杀整棵进程树。

POSIX杀进程组。

## 二、模块里的主要成员

- LocalSandbox：本地文件系统沙箱类。继承Sandbox抽象。
- 路径映射相关的方法。把虚拟路径和宿主路径互相翻译。
- _resolve_path_with_mapping：把命令里的虚拟路径翻译成宿主路径。
- _reverse_resolve_path：把输出里的宿主路径翻译回虚拟路径。
- _reverse_resolve_paths_in_output：把命令输出里所有宿主路径反向翻译。
- _is_read_only_path：判断路径是否只读。公开技能目录是只读的。
- execute_command：执行shell命令。带超时和输出捕获。
- _run_windows_command、_run_posix_command：分平台的命令执行。
- _terminate_windows_process_tree、_terminate_process_group：分平台的进程终止。
- _BoundedPipeCapture：有界的管道捕获。超限截断。
- list_dir：列目录。走local/list_dir。
- read_file、write_file等文件操作方法。
- PathMapping：一条路径映射。虚拟路径对宿主路径。

## 三、它和谁协作

- 它实现sandbox/sandbox的Sandbox抽象。
- 它被sandbox/local/local_sandbox_provider.py创建和管理。
- 它依赖sandbox/env_policy构建环境变量。
- 它依赖sandbox/search做搜索。
- 它被sandbox/middleware和工具层消费。

## 四、重要性评级

评级是8分。

理由是它是本地模式的沙箱实现。

代理的命令执行、文件操作都经过它。

路径映射是公开契约的保证。

命令超时和输出上限防止挂起和内存爆炸。

分平台的进程管理是难写对的部分。

它是实际执行代理命令的地方。
