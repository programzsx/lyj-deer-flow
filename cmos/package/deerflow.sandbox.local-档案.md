# deerflow.sandbox.local-档案

## 一、这个包是干什么的

这个包是本地文件系统沙箱实现。

DeerFlow支持多种沙箱。
沙箱可以是Docker容器。
沙箱可以是远程虚拟机。
沙箱也可以就是本地文件系统。

这个包提供最后那种。
它直接在宿主机上执行命令。
它用路径映射做线程隔离。
它不需要Docker，也不需要远程服务。

这个包有两个核心类。
一个是`LocalSandbox`。
一个是`LocalSandboxProvider`。

它是默认的沙箱选择。
开发和轻量部署都用它。

## 二、包里的主要成员

### （一）模块__init__.py——公共出口

只导出`LocalSandboxProvider`。

### （二）模块local_sandbox.py——沙箱实现

#### 1、LocalSandbox类

这个类实现`Sandbox`抽象接口。
它声明`persistent_shell_sessions = False`。
每次命令都是全新的subprocess.run进程。
没有shell状态跨调用存活。

#### 2、命令执行

`execute_command`执行bash命令。

命令超时默认600秒。
超时由`DEFAULT_COMMAND_TIMEOUT_SECONDS`定义。
超时会终止进程。
终止按进程组进行。
阻塞的前台命令不会无限挂起一个回合。
超时提示会告诉模型如何后台化长驻进程。

输出捕获是有界的。
`_BoundedPipeCapture`排干子进程管道。
内存里只保留有界输出。
上限是10MB。
超出部分被丢弃。
输出末尾会附加截断提示。
提示记录保留了多少字节、总共多少字节。

管道由独立线程排干。
`_start_pipe_drain`启动守护线程。
主流程不被大输出阻塞。

输出解码按平台区分。

- POSIX保持字节解码。
- Windows处理locale码页、UTF-8、CRLF、裸CR。文本流用universal newlines翻译。

stdin接/dev/null。
读stdin的命令立即得到EOF。

#### 3、路径映射

`PathMapping`是路径映射数据类。
它有container_path、local_path、read_only三个字段。

`LocalSandbox`把虚拟路径翻译成宿主路径。
`/mnt/user-data/workspace`映射到线程的工作目录。
`/mnt/user-data/uploads`映射到上传目录。
`/mnt/user-data/outputs`映射到输出目录。

翻译有两个场景。
命令串里的路径。
文件内容里的路径。
两个场景用不同的正则匹配。
`_command_pattern`处理命令串。
`_content_pattern`处理文件内容。

匹配是shell感知的。
只匹配路径段边界。
防止`/mnt/skills`匹配到`/mnt/skills-extra`内部。

正则模式用cached_property缓存。
path_mappings在构造后不再变化。
缓存避免了每次调用重复编译。

#### 4、反向解析

沙箱跟踪自己写过的文件。
`_agent_written_paths`记录write_file写过的路径。
read_file只对智能体写过的内容做反向解析。
反向解析把宿主路径还原成虚拟路径。

#### 5、平台适配

类里有多个平台判断辅助。
`_is_powershell`判断PowerShell。
`_is_cmd_shell`判断cmd.exe。
`_is_msys_shell`判断Git Bash/MSYS。

MSYS路径转换有排除逻辑。
排除只限安全的非根虚拟前缀。
Windows原生CLI启动器需要正常的MSYS路径转换。

### （三）模块local_sandbox_provider.py——提供者

#### 1、LocalSandboxProvider类

这个类实现`SandboxProvider`接口。
它提供本地文件系统执行。

它为每个thread_id生成独立的沙箱。
沙箱id格式是`local:{user_id}:{thread_id}`。

早期版本返回全局单例。
单例无法遵守`/mnt/user-data/...`契约。
因为对应的宿主目录是按线程的。
现在的版本按线程隔离。

无线程上下文的调用保留旧版单例。
id为字面量`local`。

它声明`uses_thread_data_mounts = True`。
它声明`needs_upload_permission_adjustment = False`。

#### 2、路径映射构建

`_build_thread_path_mappings`构建按线程的映射。
映射覆盖几类路径。

- `/mnt/user-data`及其三个子目录。workspace、uploads、outputs。
- `/mnt/acp-workspace`。ACP智能体的工作区。
- `/mnt/skills`及其分类子目录。public、custom、legacy、integrations。

有一个父级聚合映射。
`ls /mnt/user-data`等父级操作和AIO行为一致。
子目录映射按路径长度排序后优先匹配。

获取时会先确保线程目录存在。
`paths.ensure_thread_dirs`创建宿主目录。

#### 3、技能投影

`_ensure_skills_projection`确保技能投影就绪。
public技能投影在Gateway启动时确保。
用户投影在acquire时懒修复。
线程投影在沙箱复用前重算。

public技能挂载是只读的。
custom技能挂载是按用户的。
legacy挂载只暴露给还没有按用户自定义技能的用户。
否则用户能读到列表层说不存在的文件。

#### 4、缓存管理

按线程的沙箱放在`OrderedDict`里。
这是一个LRU缓存。
默认256条。
缓存由`threading.Lock`串行保护。

`get`返回缓存的沙箱。
`reset`清空缓存。
淘汰的线程下次获取会重建。
只丢失反向解析提示。
丢失后read_file优雅降级。

#### 5、安全声明

`supports_agent_skill_isolation`是动态属性。
它读取`is_host_bash_allowed`。
宿主bash启用时返回False。
宿主bash子进程可以绕过PathMapping走规范路径。
所以宿主bash启用时不能声明隔离。

### （四）模块list_dir.py——目录列举

独立的`list_dir`函数。
它按深度遍历目录。
默认深度2。
它跳过忽略项。
它过滤符号链接。
链接解析到根外的条目被跳过。
它依赖共享的`should_ignore_name`。

## 三、它和谁协作

上游是sandbox包的抽象。
`LocalSandbox`实现`Sandbox`。
`LocalSandboxProvider`实现`SandboxProvider`。

消费方是SandboxMiddleware。
中间件通过提供者获取沙箱。

它和skills系统协作。
acquire时确保技能投影。
挂载投影目录。

它和uploads系统协作。
uploads目录可能被挂载进本地沙箱。
上传写入需要防符号链接。

它和config系统协作。
`config.sandbox.use`解析到这个提供者。
自定义挂载来自`config.sandbox.mounts`。

它是AIO提供者的对照实现。
AIO把同样的虚拟路径挂载进容器。
本地提供者用路径映射模拟同样的契约。

## 四、重要性评级

评级：8分。

理由如下。

这个包是默认沙箱实现。
开发和轻量部署完全依赖它。
没有它，无线程Docker环境跑不了任何智能体任务。

它被引用的面很广。
约20个文件直接引用这个包。
主要集中在sandbox抽象、工具层和配置。

它是核心路径的本地形态。
文件读写、命令执行、技能脚本运行都经过它。

它不是唯一实现。
AIO、E2B、BoxLite、Tenki提供替代品。
删除它，本地部署退化为必须配Docker。
抽象层不受损。
其他实现不受影响。

它的实现复杂度集中在平台兼容。
Windows解码、MSYS转换、有界捕获都是为可靠性服务的。
