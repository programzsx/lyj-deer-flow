# deerflow.community.boxlite档案

本文档解读deerflow.community.boxlite这个包。

本文档基于对该包目录下全部代码文件的实际阅读。

本文档的读者是想理解BoxLite微虚拟机集成的开发者。

## 一、这个包是干什么的

这个包是BoxLite微虚拟机的沙箱后端集成。

BoxLite是一个无守护进程的OCI原生微虚拟机运行时。

Linux上用libkrun和KVM。

macOS上用Hypervisor.framework。

每个沙箱是一个硬件隔离的虚拟机。

每个虚拟机有自己的内核。

任何OCI镜像不改一行就能跑。

这个包把BoxLite接到DeerFlow的Sandbox和SandboxProvider契约后面。

和AIO沙箱对比。

AIO沙箱是容器隔离。

boxlite是硬件级隔离。

boxlite的隔离更强。

这个包对应issue #3936。

## 二、包里的主要成员

### 1、BoxliteBox

BoxliteBox是委托给BoxLite SimpleBox的Sandbox适配器。

BoxliteBox继承自deerflow.sandbox.sandbox.Sandbox。

BoxliteBox实现了完整契约。

契约包括execute_command。

契约还包括read_file、write_file、update_file、download_file、list_dir、glob、grep。

文件操作都是在box里跑shell命令实现的。

用的是cat、find、grep、分块base64。

解析用的是deerflow.sandbox.search的共享辅助函数。

命令只用busybox可移植的flag。

所以任何OCI镜像都能工作。

每次调用都是全新的sh -lc执行。

没有shell状态能活到下一条命令。

persistent_shell_sessions是False。

BoxliteBox有一个事件循环桥接问题要解决。

BoxLite的SDK是异步原生的。

box句柄和事件循环绑定。

DeerFlow的Sandbox契约是同步的。

DeerFlow可能在任意asyncio.to_thread工作线程里调用它。

解决办法是注入一个run可调用对象。

run用run_coroutine_threadsafe把协程调度到专用循环上。

这样每个操作都在box启动的那个循环上跑。

BoxliteBox还做了错误分类。

TERMINAL_ERROR_MARKERS包括vsock断开、broken pipe、连接重置等。

这些错误是终结性的。

RETRYABLE_ERROR_MARKERS包括transport not ready等。

这些错误可以重试。

终结性失败会触发on_terminal_failure回调。

回调让Provider销毁并注销这个box。

路径安全方面。

_guard_traversal拒绝带..的路径穿越。

download_file还要求路径必须在/mnt/user-data前缀下。

写文件用分块base64。

每个块60000字节。

这个大小低于Linux的MAX_ARG_STRLEN限制。

60000是4的倍数。

每个块是自包含的base64单元。

解码后的字节拼接不会丢数据。

### 2、BoxliteProvider

BoxliteProvider是委托给BoxLite的SandboxProvider。

BoxliteProvider让每个DeerFlow沙箱跑成一个BoxLite微虚拟机。

Provider为每个(user, thread)创建一个微虚拟机。

沙箱ID是确定性的。

ID从用户和线程作用域推导。

ID包含user_id。

ID包含user_id的目的是一个用户的box不能被另一个用户的线程收回。

Provider的配置从SandboxConfig读取。

SandboxConfig是extra="allow"的。

所以BoxLite专属的键可以出现在config.yaml的sandbox:下面。

可配置项包括image、memory_mib、cpus、replicas、idle_timeout、environment。

Provider有一个_EventLoopThread。

_EventLoopThread是跑在专用守护线程上的私有asyncio事件循环。

不使用BoxLite自己的同步门面。

那个门面拒绝在异步上下文里运行。

那个门面也是线程绑定的。

Provider预热池的处理如下。

release把box放进预热池。

虚拟机保持运行。

回收时如果刚释放不久可以跳过健康检查。

跳过要满足三个条件。

条件一是本Provider自己释放的。

条件二是配置了health_check_skip_seconds。

条件三是释放时间在窗口内。

启动收编的box必须先验证再复用。

其他来源的box总是做健康检查。

健康检查是跑echo ok这个命令。

Provider启动时会做孤儿收编。

收编按DeerFlow专属的名字前缀发现box。

收编的box进入预热池。

空闲回收线程会接管后续清理。

replicas限制是软上限。

活跃加预热的box数到容量时。

最老的预热box会被逐出。

Provider的reset是轻量钩子。

reset把活跃box转进预热池。

reset不销毁运行中的虚拟机。

reset让配置变化在下次构造Provider时生效。

shutdown关闭所有box和事件循环。

### 3、_SyncBoxAdapter

_SyncBoxAdapter把同步的BoxLite Box句柄适配成异步SimpleBox的接口。

这个适配器用于启动收编路径。

收编拿到的是同步句柄。

适配器的stop会同时停掉box和runtime。

### 4、SandboxIdentityCollisionError

SandboxIdentityCollisionError表示确定性ID已经记录给了别的用户和线程。

活跃box属于另一个身份时抛这个异常。

## 三、它和谁协作

这个包依赖的外部组件如下。

- boxlite这个Python包，可选依赖，pip install "deerflow-harness[boxlite]"
- Linux主机的KVM，或嵌套虚拟化
- macOS的Hypervisor.framework
- deerflow.config，读取沙箱配置
- deerflow.sandbox，复用Sandbox契约、远程list_dir和搜索辅助函数
- warm_pool_lifecycle，预热池的公共逻辑

这个包被谁调用。

config.yaml里用`sandbox.use: deerflow.community.boxlite:BoxliteProvider`选择这个Provider。

Gateway的沙箱中间件通过SandboxProvider接口调用它。

boxlite的依赖是懒导入的。

不装boxlite时整个harness和其他Provider照样能安装。

## 四、重要性评级

评级：7分。

理由如下。

boxlite提供了硬件级隔离。

硬件级隔离比容器隔离更强。

这是沙箱安全的一个升级选项。

这个包实现了完整的Sandbox契约。

事件循环桥接、预热池、孤儿收编、身份冲突保护都做了。

实现质量比较高。

扣分的原因如下。

它是可选依赖。

它需要特殊的宿主环境。

Linux要KVM，云主机要嵌套虚拟化。

macOS才用Hypervisor.framework。

很多部署环境不满足条件。

社区里AIO沙箱和e2b是更常见的选择。

boxlite是三个沙箱选项里最新也最少用的。
