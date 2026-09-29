# LocalSandbox-档案

## 一、这个类是干什么的

LocalSandbox是sandbox/local/local_sandbox.py里的类。

它继承Sandbox。

它是本地子进程沙箱。

每次调用都是全新的subprocess.run进程。

shell状态不会存活到下一条命令。

persistent_shell_sessions为False。

它不隔离进程。它靠路径映射和env过滤来限制。

它的核心能力如下。

路径映射把容器路径翻译成本地路径。

例如/mnt/skills映射到宿主机的skills目录。

命令里的容器路径被解析成本地路径。

输出里的本地路径被反向解析回容器路径。

模型永远看不到真实的宿主机路径。

这防止泄露真实用户名和完整目录树。

这个类位于backend/packages/harness/deerflow/sandbox/local/local_sandbox.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、PathMapping和ResolvedPath

PathMapping是冻结数据类。

字段是container_path、local_path、read_only。

skills目录默认只读。

ResolvedPath是NamedTuple。字段是path和mapping。

### 2、_BoundedPipeCapture

这个类在排空子进程管道的同时只保留有界输出。

上限10MiB。

超出的字节被丢弃但计数。

read返回带截断提示的解码文本。

文本流用universal newlines。CRLF和CR都转LF。

### 3、shell检测

_get_shell按顺序探测。

POSIX是/bin/zsh、/bin/bash、/bin/sh、sh。

Windows回退到PowerShell和cmd.exe。

_is_msys_shell识别Git Bash或MSYS shell。

### 4、路径解析

_find_path_mapping按容器路径最长前缀匹配。

_resolve_path_with_mapping解析并检查包含性。

路径逃出挂载目录时抛PermissionError。

_reverse_resolve_path把本地路径反向解析回容器路径。

挂载下的符号链接可能解析到所有挂载之外。

它自己的拼写仍然命名挂载内的路径。

所以翻译那个拼写。

不把链接目标的宿主路径交给模型。

_container_path_for_local的包含检查用os.sep。

不用硬编码"/"。

硬编码"/"在Windows上永远匹配不了反斜杠连接的嵌套路径。

每个嵌套路径会悄悄落进回退分支。

泄露真实宿主路径。这是修过的bug。

### 5、cached_property组

_command_pattern编译命令里的容器路径匹配器。

shell感知的边界字符。lookahead防止/mnt/skills匹配进/mnt/skills-extra。

_content_pattern编译文件内容里的匹配器。文本边界。

_resolved_local_paths每个映射只做一次文件系统realpath。

_mappings_by_container_specificity和_mappings_by_local_specificity是排好序的视图。

path_mappings在__init__设置后不变。

所以缓存稳定。这是代理热路径的优化。

### 6、execute_command方法

先_validate_extra_env验证env键。

防御纵深。本地实现不过shell。但AIO沙箱会把键拼接进export。

两边强制同一规则。

然后解析命令里的容器路径。

env继承os.environ减平台秘密。再叠加请求级秘密。这对应#3861。

显式env总是传。平台凭证不泄露进技能子进程。

超时默认600秒。

超时时Windows用taskkill杀整棵进程树。

POSIX用killpg杀整个进程组。

超时标记Exit Code 124。

coreutils timeout约定。

exit-status证据消费者不能把部分输出读成成功。

MSYS shell设置MSYS2_ARG_CONV_EXCL排除虚拟根。

### 7、管道和进程管理

_run_windows_command和_run_posix_command用daemon排空线程。

不用communicate。

后台长驻进程继承管道。communicate会阻塞到超时。

排空线程让前台shell一退出调用就返回。

stdin取/dev/null。读stdin的命令立即EOF。

start_new_session让阻塞命令能被整组杀死。

### 8、文件操作

read_file读取并只对write_file写过的文件做反向路径解析。

用户上传和外部工具输出不能被悄悄改写。这对应PR#1935讨论。

write_file解析内容里的容器路径。检查只读。跟踪agent写入路径。

update_file写二进制。

download_file限制在VIRTUAL_PATH_PREFIX下。上限100MiB。

错误重抛时用原始路径。隐藏内部解析路径。

### 9、list_dir方法

list_dir覆盖虚拟子目录。

/mnt/skills可能只有分类挂载没有聚合根映射。

解析的宿主路径不存在时继续用虚拟子节点。

缺失的虚拟子目录被补回。代理能通过ls发现它们。

比较用完整容器路径。

不用裸子名。

否则已列出的挂载会被追加第二次。

## 三、它和谁协作

- Sandbox是基类契约。
- LocalSandboxProvider创建和管理它。
- list_dir、find_glob_matches、find_grep_matches是底层文件工具。
- build_sandbox_env构建过滤后的env。
- path_patterns的replace_output_path_matches替换输出里的路径。
- 上传目录被挂载进来。所以有符号链接防御需求。

## 四、重要性评级

评级是9分。

理由如下。

LocalSandbox是本地执行的物理边界。

所有bash命令、文件读写都经过它。

路径双向翻译防止宿主路径泄露。

逃出挂载目录抛PermissionError。

只读挂载强制执行。

env过滤防止平台凭证泄露。

有界管道捕获防止内存爆炸。

进程组杀死防止僵尸进程。

这些是安全和稳定性核心。

扣掉1分。

扣分原因是真正的强隔离在AIO沙箱。

本地沙箱只是轻量边界。
