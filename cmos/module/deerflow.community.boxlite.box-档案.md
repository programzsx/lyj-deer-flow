# 模块档案：deerflow.community.boxlite.box

## 一、这个模块是干什么的

这个模块定义BoxliteBox类。
BoxliteBox是DeerFlow沙箱契约的一个适配器。
它的底层是BoxLite微型虚拟机。
先解释背景。
DeerFlow的Sandbox契约是同步的。
BoxLite的SDK是异步原生的。
而且BoxLite的box句柄绑定在创建它的事件循环上。
这个问题叫loop-affine。
为了解决这个矛盾。
boxlite.provider模块拥有一个私有事件循环。
这个循环跑在一个守护线程上。
provider注入一个run函数。
run函数把每个协程通过run_coroutine_threadsafe投递到那个循环上。
这样每个操作都跑在box启动时的那个循环上。
不管DeerFlow从哪个asyncio.to_thread工作线程调用，都是安全的。
沙箱的每个文件操作都靠在box里跑shell命令实现。
读取用cat。
查找用find。
搜索用grep。
写入用分块的base64。
命令只用busybox可移植的参数。
所以任何OCI镜像都能用。

## 二、模块里的主要成员

（1）BoxliteBox类
这个类继承自deerflow.sandbox.sandbox.Sandbox。
构造参数有id、box、run。
box是一个已启动的SimpleBox。
run是把协程投递到provider私有循环的函数。
default_env是合并进每条命令的静态环境变量。
per-call的env可以覆盖它。
类属性persistent_shell_sessions是False。
意思是每次调用都是一次全新的sh -lc执行。
shell状态不会保留到下一条命令。
类里还定义了终态错误标记和可重试错误标记两组字符串。
终态错误包括连接断开、broken pipe等。
可重试错误包括transport not ready等。

（2）命令执行
execute_command把DeerFlow传来的bash命令字符串通过sh -lc执行。
它会校验额外环境变量的键名。
返回合并的stdout和stderr。
退出码非零时把Exit Code保留在输出文本里。
timeout同时约束两层。
一层是BoxLite SDK内部的命令超时。
另一层是事件循环桥的result等待超时。
这样调用线程不会被永久阻塞。

（3）文件操作
read_file用cat读文件。
支持按行号截取。
行号会做钳制。
负数起点不会绕回。
write_file和update_file用base64分块写入。
每个base64块60000字节。
这个大小远低于Linux单个argv参数的128KiB上限。
60000还是4的倍数。
所以每块解码后可以无损拼接。
download_file有100MB的大小上限。
下载前先用wc -c查文件大小。
超限直接报错。
list_dir和glob、grep用共享的remote_search辅助命令。
解析结果也用共享的解析器。

（4）路径安全
_guard_traversal拒绝包含..的路径。
防止路径穿越。
download_file还要求路径必须在/mnt/user-data虚拟前缀之下。

## 三、它和谁协作

这个模块依赖谁。
依赖deerflow.sandbox包的多个共享模块。
包括remote_list_dir、remote_search、search。
依赖deerflow.config.paths的VIRTUAL_PATH_PREFIX。
BoxLite SDK只在TYPE_CHECKING时导入。
真正的导入由provider的懒加载函数完成。

谁调用这个模块。
boxlite.provider模块调用它。
provider负责创建和销毁BoxliteBox。
终端失败时provider通过回调销毁box。

## 四、重要性评级

评级：5分。
理由：这是一个社区沙箱后端的适配器。它解决了一个真实且棘手的问题，就是同步契约和异步loop-affine SDK之间的桥接。它的文件操作全部靠shell命令实现，写法上有不少细节，比如base64分块、busybox兼容、行号钳制、结果上限判断。这些细节都对应真实的bug修复。但是BoxLite本身是可选集成的社区后端，不是主路径。所以给5分。
