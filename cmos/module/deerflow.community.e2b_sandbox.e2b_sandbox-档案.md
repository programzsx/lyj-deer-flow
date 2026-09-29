# 模块档案：deerflow.community.e2b_sandbox.e2b_sandbox

## 一、这个模块是干什么的

这个模块定义E2BSandbox类。
E2BSandbox是DeerFlow沙箱契约的一个适配器。
它的底层是e2b云沙箱。
e2b是一个云端沙箱服务。
DeerFlow用它的code-interpreter SDK。
这个适配器把DeerFlow的Sandbox操作翻译成e2b的调用。
命令执行用sandbox.commands.run。
文件读取写入用client.files。
目录和内容搜索靠在沙箱里跑find和grep命令。
解析结果用共享的deerflow.sandbox.search辅助模块。
路径处理上有一个映射。
DeerFlow的虚拟前缀是/mnt/user-data。
e2b模板默认的工作目录是/home/user。
所以/mnt/user-data会被重写到home_dir下面。
其他绝对路径原样通过。

## 二、模块里的主要成员

（1）E2BSandbox类
这个类继承自deerflow.sandbox.sandbox.Sandbox。
构造参数有id、client、home_dir。
client是一个活的e2b_code_interpreter.Sandbox同步实例。
调用方拥有连接并负责kill。
这个包装器只在release时关闭宿主侧的HTTP客户端。
类属性persistent_shell_sessions是False。
每次调用都是一次全新的执行。
shell状态不保留。
实例属性mount_upload_result保存挂载上传的结果。
这是创建时上传宿主挂载的结构化结果。

（2）命令执行与死亡检测
execute_command通过sandbox.commands.run执行命令。
锁会串行化同一实例上的并发调用。
因为e2b SDK每个沙箱共享一条HTTP/2连接。
返回合并的stdout和stderr。
退出码非零时把Exit Code保留在输出文本里。
额外环境变量会校验POSIX键名规则。
环境变量作为envs传给e2b。
只作用于这条命令。
绝不拼进命令字符串。
_is_sandbox_gone_error识别沙箱已被回收的错误。
签名包括"sandbox was not found"和"paused sandbox"等。
遇到这类错误就把_dead标记设为true。
之后的调用直接短路。
ping做廉价健康检查。
跑一条true命令。
执行成功说明整条HTTP路径都活着。
包括认证、控制面、envd。

（3）文件操作
read_file读文件。
支持行号截取。
行号做钳制。
download_file有100MB上限。
优先用流式API。
流式API让上限在网关进程缓冲整个载荷之前执行。
format等于bytes时SDK内部还是先物化整个文件。
多GB的交付物会OOM共享网关。
所以优先format等于stream。
流式路径逐块累计字节。
超限立刻报错。
最后释放连接。
write_file支持追加。
e2b没有追加写入。
所以做读改写。
只有显式的文件未找到才当空文件。
其他读取失败拒绝覆盖。
防止把原文件覆盖成只剩尾部。
update_file写字节内容。
e2b的files.write接受str或bytes。
传字节无损保留二进制。
glob和grep用find和grep命令。
结果上限的判断采用"多看一条"规则。
返回第max_results条时无法区分"正好这么多"和"还有更多"。
所以看到超过上限的那一条才返回截断标记。

## 三、它和谁协作

这个模块依赖谁。
直接依赖e2b和e2b_code_interpreter两个SDK。
e2b是必需依赖。
依赖deerflow.sandbox的共享搜索辅助模块。
依赖VIRTUAL_PATH_PREFIX。

谁调用这个模块。
同目录的e2b_sandbox_provider调用它。
provider负责创建、复用、回收E2BSandbox。
MountUploadResult类型从provider的TYPE_CHECKING导入。

## 四、重要性评级

评级：6分。
理由：这是e2b云沙箱后端的适配器核心。它处理了很多真实的边界问题。流式下载防止OOM。追加写入防止覆盖。沙箱回收的死态检测防止反复撞错。结果上限的多看一条规则防止误报截断。这些细节都有注释说明原因。e2b是DeerFlow支持的主要云沙箱后端之一。属于可选但被重点使用的集成。给6分。
