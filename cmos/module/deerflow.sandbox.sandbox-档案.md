# deerflow.sandbox.sandbox档案

## 一、这个模块是干什么的

这个模块定义沙箱的抽象接口。

DeerFlow的Agent需要在一个隔离的环境里执行命令和读写文件。这个隔离环境就是沙箱。沙箱有很多种实现。本地文件系统、Docker容器、远程云沙箱。这个模块定义全部实现都要遵守的抽象基类`Sandbox`。

抽象基类规定了两类内容。

第一类。全部实现必须提供的方法。执行命令、读文件、下载文件、列目录、写文件、glob查找、grep搜索、更新二进制文件。

第二类。全部实现都要遵守的契约细节。异常类型、返回值语义、环境变量键名校验。

## 二、模块里的主要成员

### 1、Sandbox抽象基类

这是沙箱的核心接口。

类属性`persistent_shell_sessions`是一个三态字段。表示`execute_command`是否跨调用复用一个持久shell会话。True表示会话状态（导出、cwd、函数）跨调用存活。False表示每次调用是全新shell。

三态、失败关闭。None（默认）表示实现没有声明会话语义。自定义provider按类路径加载。可能复用持久会话。所以沉默不能读成新shell。消费者只信任显式的False。None和True一样降级成UNVERIFIED。每个出厂实现都显式声明。AIO是True。每次调用的exec provider是False。

主要方法有下面这些。

- `execute_command(command, env, timeout)`，抽象方法。在沙箱里执行bash命令。env是每次调用的环境变量注入。用来传请求范围的秘密。比如短期的终端用户token或GitHub App安装token。秘密不进prompt、工具参数或命令字符串。timeout是每次调用的墙钟超时。
- `execute_command_in_scope`，在可选的Agent执行作用域里执行命令。没有服务端shell会话的provider继承普通命令行为。有会话感知的provider可以隔离并发的Agent执行。
- `release_command_scope(scope_id)`，释放一个执行作用域的provider特定命令状态。默认不做任何事。
- `read_file(path, start_line, end_line)`，抽象方法。读文件内容。支持行范围。
- `download_file(path)`，抽象方法。下载文件的二进制内容。路径穿越抛PermissionError。读不了或不存在抛OSError。本地和远程实现必须统一抛OSError。
- `list_dir(path, max_depth)`，抽象方法。列目录内容。缺失路径抛FileNotFoundError。执行失败抛OSError。不能返回空列表表示失败。因为ls_tool把空列表渲染成"(empty)"。
- `write_file(path, content, append)`，抽象方法。写文本文件。
- `glob(path, pattern)`，抽象方法。查找匹配的路径。返回匹配和truncated标志。
- `grep(path, pattern)`，抽象方法。搜索文件内容。返回匹配和truncated标志。
- `update_file(path, content)`，抽象方法。用二进制内容更新文件。

### 2、_validate_extra_env函数

校验env键是否是合法的POSIX环境变量名。规则是`^[A-Za-z_][A-Za-z0-9_]*$`。

这是纵深防御。今天没有实现把键拼进shell字符串。本地沙箱把dict传给subprocess.run(env=...)。没有shell。AIO沙箱通过bash.exec的结构化env字段转发。e2b作为SDK的envs转发。在抽象层强制POSIX规则是为了未来。一个未来会拼shell的实现不用自己推导规则。一个从配置或用户输入派生键的调用者会快速失败。

### 3、glob和grep的truncated语义

两个方法都返回（结果，truncated）。truncated为true表示结果可能不完整。搜索在输出上限处停了。或者max_results之外的匹配被丢了。

provider决定第二个case的精度不同。持有完整列表的provider能区分恰好满和被切断。读有上限流的provider不能。所以把标志理解为"可能不完整"。永远不要当成计数。

## 三、它和谁协作

这个模块依赖`deerflow.sandbox.search.GrepMatch`。

这个模块被全部沙箱实现继承。本地沙箱、AIO、E2B、Boxlite、Tenki都继承Sandbox。

这个模块被`deerflow.sandbox.tools`消费。工具层调用沙箱的方法。

这个模块被`deerflow.sandbox.file_operation_lock`引用。文件锁用沙箱的id做键。

## 四、重要性评级

评级是9分。

理由。这个模块是全部沙箱实现的契约根基。所有沙箱操作都从这个接口进出。没有这个抽象基类。本地、Docker、远程沙箱就没有统一形状。工具层就得为每种沙箱写一套代码。

契约细节的设计是这个模块最关键的部分。异常类型的统一（OSError、FileNotFoundError）让调用者有一个异常类型可处理。空列表和失败的区分保护了ls_tool的渲染语义。truncated标志的"可能不完整"语义保护了搜索结果的可靠性。persistent_shell_sessions的三态设计保护了证据消费者。env键名的POSIX校验是纵深防御。

扣一分的原因。它是接口定义。它自己不做任何实际工作。具体实现和工具层才是执行者。
