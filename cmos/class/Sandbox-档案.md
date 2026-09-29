# Sandbox档案

源码位置：backend/packages/harness/deerflow/sandbox/sandbox.py

## 一、这个类是干什么的

Sandbox是沙箱环境的抽象基类。

Sandbox定义了沙箱必须提供的全部文件和命令操作。具体实现继承它。实现包括本地沙箱、AIO Docker沙箱、E2B远程沙箱、BoxLite、Tenki等。

Sandbox定义的操作有这些。

命令执行。execute_command在沙箱里执行bash命令。execute_command_in_scope在可选的Agent执行作用域里执行命令。release_command_scope释放作用域的命令状态。

文件操作。read_file读文件内容。download_file下载二进制内容。list_dir列目录。write_file写文件。update_file用二进制内容更新文件。

搜索操作。glob按模式找路径。grep在文件里搜文本。两个操作都返回匹配列表和truncated标志。

Sandbox还有一个重要的类属性。persistent_shell_sessions。这个属性声明execute_command是否跨调用复用一个持久的shell会话。这是三态设计。None表示实现没声明。None时按未验证处理。True表示持久会话。False表示每次调用新shell。证据消费者只能信任显式的False。

env参数的安全校验。execute_command的env参数用于注入请求级密钥。密钥不进提示词、不进工具参数、不进命令字符串。_validate_extra_env校验env键。键必须符合POSIX环境变量名规则。这个校验是纵深防御。未来的shell拼接实现不用重新推导规则。

## 二、类的成员

（一）字段

- _id：沙箱id。
- persistent_shell_sessions：三态的shell会话语义声明。默认None。

（二）方法

- execute_command：执行bash命令。抽象方法。
- execute_command_in_scope：在作用域里执行命令。默认透传。
- release_command_scope：释放作用域。默认透传。
- read_file：读文件。抽象方法。
- download_file：下载二进制文件。抽象方法。
- list_dir：列目录。抽象方法。缺失路径必须抛FileNotFoundError。失败必须抛OSError。不能返回空列表。
- write_file：写文件。抽象方法。
- glob：按模式找路径。抽象方法。返回匹配列表和truncated标志。
- grep：搜文本。抽象方法。返回GrepMatch列表和truncated标志。
- update_file：更新二进制文件。抽象方法。

## 三、它和谁协作

（一）实现者

LocalSandbox、AioSandbox、E2BSandbox、BoxliteBox、TenkiSandbox等继承Sandbox。

（二）工具层

tools.py的bash、ls、glob、grep、read_file、write_file、str_replace工具通过Sandbox接口操作沙箱。

（三）提供者

SandboxProvider的get方法返回Sandbox实例。

## 四、重要性评级

评级：9分。

理由：Sandbox是整个沙箱系统的接口基石。所有沙箱实现和所有沙箱工具都依赖这个抽象。它的契约文档（异常类型、空列表语义、truncated标志、env安全校验、三态会话声明）决定了实现者和消费者之间的行为约定。没有它，沙箱抽象就不存在。给9分。
