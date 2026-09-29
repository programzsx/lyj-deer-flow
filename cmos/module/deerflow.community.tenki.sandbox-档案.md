# 模块档案：deerflow.community.tenki.sandbox

## 一、这个模块是干什么的

这个模块定义TenkiSandbox类。
TenkiSandbox是DeerFlow沙箱契约的适配器。
它的底层是Tenki云沙箱。
Tenki的Python SDK是同步的。
发行包叫tenki。
它带tenki_sandbox模块。
和boxlite不一样。
这个适配器直接调SDK。
不需要事件循环桥。
文件传输用Tenki原生的sandbox.fs API。
这个API是二进制安全的。
支持流式。
所以不需要base64加shell编码。
目录和内容搜索还是靠在沙箱里跑find和grep命令。
fs API是单层的。
没有内容搜索。
解析用共享的deerflow.sandbox.search辅助模块。
命令只用busybox可移植的参数。
所以任何Tenki基础镜像都能用。
Tenki SDK不在模块加载时导入。
只有异常类名按字符串匹配。
导入这个包永远不需要装tenki。

## 二、模块里的主要成员

（1）TenkiSandbox类
这个类继承自deerflow.sandbox.sandbox.Sandbox。
构造参数有id、sandbox、default_env、home_dir、on_terminal_failure。
类属性persistent_shell_sessions是False。
每次调用都是一次全新的sh -lc执行。
shell状态不保留。

（2）路径映射
Tenki沙箱以无特权tenki用户运行。
HOME是/home/tenki。
/mnt归root所有。
DeerFlow的/mnt/user-data虚拟前缀不能直接写。
所以文件操作重映射到home目录下。
provider还尽力把/mnt/user-data软链到HOME。
Agent shell命令用字面路径也能工作。
_resolve_path做重映射。
其他绝对路径原样通过。
沙箱需要访问系统目录时可以。
穿越永远拒绝。
_virtual_path是重映射的反向。
list_dir、glob、grep返回的路径报告成虚拟前缀形式。
不报告沙箱内部的home目录。
结果可以直接喂回其他文件API。

（3）终态错误与生命周期
_TERMINAL_ERROR_NAMES是一组异常类名字符串。
表示远程会话彻底没了。
有SessionTerminatedError、SessionNotFoundError、InvalidStateError、StreamClosedError。
按字符串匹配。
这样这个模块导入时不需要tenki。
_is_terminal_failure还按isinstance把内置的ConnectionError、BrokenPipeError、EOFError当终态。
传输重置也驱逐沙箱。
下次获取冷启动。
这是有意的保险。
重置往往意味着微型虚拟机没了。
代价是一次偶发的网络抖动会换掉一个温池沙箱。
close先终止底层会话。
适配器在会话真的没了之后才标记closed。
失败的终止保持可重试。
不会静默泄漏一台运行中、计费的沙箱。
终态会话错误算已关闭。
其他错误抛出让调用方重试或告警。

（4）命令执行与文件操作
execute_command跑sh -lc。
每条命令的env叠加静态配置环境。
只作用于这条命令。
输出合并stdout和stderr。
退出码非零保留在输出文本里。
_fs_op跑原生的sandbox.fs调用。
锁横跨op。
并发的调用在同一沙箱上串行化。
Tenki SDK每个实例共享一条连接。
_note_failure在锁释放之后运行。
它会回到provider。
provider按相反顺序加锁。
同时持两把锁可能死锁。
write_file的追加用读改写。
Tenki的写流没有追加模式。
从偏移0开始。
读和写是两个fs操作。
两个并发追加可能都读到同一份前像。
第二个会覆盖第一个。
_write_lock让整个序列原子。
_write_lock和_lock分开。
追加序列可以包住整个流程。
per-op的驱逐回调不会在它下面运行。
download_file有100MB上限。
上限按实际收到的字节执行。
传输中途增长的文件也超不过。
stat加read的检查做不到这一点。
锁在读流之前释放。
和_fs_op不同。
下载最多100MB。
横跨实例锁会阻塞这个沙箱的所有其他工具整个传输时长。
Tenki读流可以和其他操作并行。
SDK在连接上多路复用。
所以接受这里的交错。
换取延迟。
终态传输错误还是通过_note_failure驱逐。
EFBIG是自己的大小上限。
不是会话死亡。
直接抛出。
不驱逐。
其他OSError是真传输失败。
必须路由到_note_failure。
没有这个。
传输中途死掉的会话永远不会被驱逐。
Agent会一直撞OSError。
直到某个别的操作碰巧回收它。
glob和grep的多看一条上限规则和其他适配器一致。

## 三、它和谁协作

这个模块依赖谁。
依赖deerflow.sandbox的共享搜索辅助模块。
依赖VIRTUAL_PATH_PREFIX。
tenki SDK只在TYPE_CHECKING导入。

谁调用这个模块。
同目录的provider.py调用它。
provider负责创建和关闭TenkiSandbox。
on_terminal_failure回调指向provider的失效方法。

## 四、重要性评级

评级：5分。
理由：这是Tenki云沙箱后端的适配器核心。它处理了home重映射、终态错误字符串匹配、追加原子性、下载锁释放、EFBIG不驱逐等大量真实细节。每个决策都有注释说明原因。它的结构和boxlite同源但少了事件循环桥。它是可选集成。给5分。
