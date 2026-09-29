# deerflow.community.opensandbox档案

本文档解读`deerflow.community.opensandbox`这个包。

本文档基于对包内三个代码文件的实际阅读。

这三个文件是`__init__.py`、`provider.py`、`sandbox.py`。

本文档的读者是想理解这套代码的开发者。

## 一、这个包是干什么的

这个包是OpenSandbox云沙箱的工具集成。

OpenSandbox是一个外部的沙箱服务。

这个包把OpenSandbox接进DeerFlow的沙箱体系。

DeerFlow的AI代理执行命令需要沙箱。

沙箱可以是本地Docker容器。

沙箱也可以是OpenSandbox这样的远程云沙箱。

这个包就是"用OpenSandbox当沙箱后端"的实现。

这个包实现了DeerFlow的`Sandbox`和`SandboxProvider`两个契约。

`SandboxProvider`负责创建和回收沙箱。

`Sandbox`负责在沙箱里执行命令和操作文件。

这个包不是DeerFlow的核心代码。

这个包是可选的社区贡献。

用户不装`opensandbox`这个依赖，DeerFlow照常运行。

## 二、包里的主要成员

### 1、`OpenSandboxProvider`

`OpenSandboxProvider`定义在`provider.py`里。

这个类是沙箱提供者。

这个类继承`SandboxProvider`。

这个类还混入`WarmPoolLifecycleMixin`。

混入这个mixin是为了复用温池生命周期逻辑。

这个类管理两类沙箱。

第一类是线程绑定的沙箱。

每个`(user_id, thread_id)`组合对应一个沙箱。

沙箱ID由`derive_sandbox_scope_token`从用户和线程推导出来。

第二类是一次性的匿名沙箱。

调用方不给`thread_id`时走这条路。

此时用随机UUID生成沙箱ID。

这个类的主要方法如下。

`acquire`负责获取一个沙箱。

线程绑定的获取路径会用`AcquireSerializer`串行化。

同一个沙箱ID的并发获取会排队。

排队是为了避免重复创建远端沙箱。

`_acquire_scope_locked`是获取的核心逻辑。

获取顺序是三步。

第一步看现有沙箱是否还在，还在就`renew`续期后复用。

第二步从温池回收一个健康沙箱。

第三步都没有就新建。

`_create_sandbox`负责新建。

新建调用OpenSandbox SDK的`SandboxSync.create()`。

创建时指定镜像，默认镜像是`python:3.11`。

创建后执行一条bootstrap命令。

bootstrap命令创建`/mnt/user-data`下的workspace、uploads、outputs三个目录。

bootstrap失败会销毁刚创建的远端沙箱并抛错。

`release`负责释放。

释放的沙箱不销毁，而是放进温池。

温池让下一次获取可以秒级回收。

`shutdown`负责进程退出时清理。

shutdown会销毁所有活跃沙箱和温池沙箱。

`__init__`里用`atexit.register`注册了shutdown。

这个类还启动一个后台线程做空闲回收。

`idle_timeout`配置控制空闲多久后回收温池沙箱。

配置项从`get_app_config().sandbox`读取。

支持的配置包括api_key、domain、protocol、image、replicas、idle_timeout、environment等。

没有配置api_key和domain时会打警告。

远端域名用明文HTTP时也会打安全警告。

SDK是懒加载的。

`_import_sdk`只在这个provider真正被使用时才导入`opensandbox`包。

不装这个依赖的其他用户完全不受影响。

### 2、`OpenSandboxSandbox`

`OpenSandboxSandbox`定义在`sandbox.py`里。

这个类是单个沙箱的适配器。

这个类继承DeerFlow的`Sandbox`基类。

这个类包住一个活的`opensandbox.sync.SandboxSync`实例。

这个类声明`persistent_shell_sessions = False`。

意思是每次执行都是一次新的`run_command`。

命令之间不保留shell状态。

这个类实现的方法如下。

`execute_command`执行shell命令。

执行结果用`format_execution`拼装。

拼装顺序是stdout、result、stderr、error。

非零退出码会附加`Exit Code: N`到输出里。

`read_file`读文件。

支持start_line和end_line行区间读取。

行号做了钳制，负数起点不会回绕。

`write_file`写文件。

append模式走读改写：先读旧内容再拼接写回。

append用单独的`_append_lock`串行化。

`download_file`下载文件。

下载限制单文件100MB。

下载路径必须在`/mnt/user-data`虚拟前缀下。

`list_dir`列目录。

`glob`按模式找文件。

`grep`按内容搜文件。

搜索都是 shells 出去执行远端`find`和`grep`命令。

输出用`deerflow.sandbox`里的共享解析器解析。

`ping`做健康检查。

健康检查就是执行一条`true`命令看退出码。

路径安全方面，`_resolve_path`做了三件事。

第一拒绝空路径。

第二拒绝包含`..`的路径穿越。

第三拒绝相对路径，只接受绝对路径。

错误处理方面，这个类定义了"终态错误"。

终态错误包括连接断开、管道断裂、`SandboxUnhealthyException`、HTTP410。

命令路径上的404也算终态。

文件路径上的404不算终态，因为文件404只是文件不存在。

遇到终态错误会触发`on_terminal_failure`回调。

回调指向provider的`_invalidate_sandbox`。

provider会把死沙箱从注册表里移除并销毁。

线程安全方面，这个类用了三把锁。

`_state_lock`保护关闭状态。

`_operation_lock`串行化每次远端操作和续期。

`_append_lock`串行化append的读改写。

### 3、`format_execution`等辅助函数

`format_execution`把SDK的执行结果转成DeerFlow的输出字符串契约。

`execution_stdout`只提取stdout。

`_is_terminal_failure`判断一个异常链里有没有终态错误。

`_exception_chain`遍历异常的`__cause__`链，用seen集合防止死循环。

`_uses_insecure_remote_http`检查远端域名是不是用了不安全的明文HTTP。

## 三、它和谁协作

### 1、依赖的上游

这个包依赖OpenSandbox的官方SDK，包名是`opensandbox`。

这个依赖是可选的，版本约束是`>=0.1.15,<0.2.0`。

这个包依赖DeerFlow的核心模块。

依赖`deerflow.config`读配置。

依赖`deerflow.sandbox`的基类、路径校验、搜索解析、串行化工具。

依赖`deerflow.config.paths`的`VIRTUAL_PATH_PREFIX`。

依赖同级的`warm_pool_lifecycle`模块复用温池机制。

### 2、服务的下游

这个包被DeerFlow的沙箱中间件调用。

用户在`config.yaml`里把`sandbox.use`配置成`deerflow.community.opensandbox:OpenSandboxProvider`即可启用。

配置项写在`sandbox:`下。

配置校验逻辑在`deerflow/config/sandbox_config.py`里，OpenSandbox的专属配置项在那里有声明。

这个包需要OpenSandbox服务本身可达。

服务地址由`domain`配置或`OPEN_SANDBOX_DOMAIN`环境变量决定。

没配则SDK默认连`localhost:8080`。

## 四、重要性评级

评级：7分。

理由如下。

这个包是完整的沙箱后端实现。

沙箱是AI代理执行代码的基础能力。

没有沙箱，代理无法安全地跑命令。

这个包完整实现了`Sandbox`契约的全部方法。

这个包的实现质量高。

温池复用、终态错误识别、锁顺序、路径安全都有细致处理。

代码里大量注释解释了设计取舍。

但是这个包是可选的社区贡献。

DeerFlow默认用的是本地沙箱和AIO沙箱。

OpenSandbox只是众多沙箱后端里的一个选择。

不用OpenSandbox的用户完全不需要这个包。

所以评级定为7分：在自己的领域内重要且实现完整，但整体上是可选依赖。
