# deerflow.community.tenki档案

本文档解读`deerflow.community.tenki`这个包。

本文档基于对包内三个代码文件的实际阅读。

这三个文件是`__init__.py`、`provider.py`、`sandbox.py`。

本文档的读者是想理解这套代码的开发者。

## 一、这个包是干什么的

这个包是Tenki云沙箱的工具集成。

Tenki是一个云沙箱服务，官网是tenki.cloud。

这个包把Tenki接进DeerFlow的沙箱体系。

每个Tenki沙箱是一个隔离的云microVM。

microVM从标准基础镜像创建。

这个包实现了DeerFlow的`Sandbox`和`SandboxProvider`两个契约。

用户把`config.yaml`里的`sandbox.use`配置成`deerflow.community.tenki:TenkiSandboxProvider`即可启用。

这个包只使用Tenki的稳定接口。

稳定接口包括沙箱创建、终止、命令执行、文件系统。

卷、快照、模板构建这些不稳定功能刻意不用。

所以这个包不需要预烘焙镜像。

这个包是可选的社区贡献。

用户不装`tenki`这个依赖，DeerFlow照常运行。

## 二、包里的主要成员

### 1、`TenkiSandboxProvider`

`TenkiSandboxProvider`定义在`provider.py`里。

这个类是沙箱提供者。

这个类继承`SandboxProvider`。

这个类混入`WarmPoolLifecycleMixin`复用温池机制。

这个类为每个`(user_id, thread_id)`组合创建一个microVM。

沙箱ID由`derive_sandbox_scope_token`从用户和线程推导。

沙箱ID包含user_id。

包含user_id是为了防止多租户网关上哈希碰撞导致一个用户回收另一个用户的沙箱。

这个类的主要方法如下。

`acquire`获取一个沙箱。

获取顺序是三步。

第一步看现有沙箱是否在注册表里。

第二步从温池回收。

第三步新建。

线程绑定的获取用`AcquireSerializer`串行化。

`acquire_async`提供不阻塞事件循环的异步获取。

整个同步获取跑在串行化器专用的执行器上。

`_create_sandbox`新建沙箱。

新建调用Tenki SDK的`client.create()`。

创建参数包括名字、workspace、sticky、镜像、CPU核数、内存等。

`wait`参数刻意传`False`。

原因是`create(wait=True)`失败时session句柄留在SDK本地。

那样会漏掉一个还在运行、还在计费的microVM。

所以provider自己调`remote.wait_ready()`等就绪。

就绪失败会调`_terminate_orphan`终止这个孤儿microVM。

创建后执行bootstrap脚本。

Tenki沙箱以非特权`tenki`用户运行。

`/mnt`目录归root所有。

所以`mkdir -p /mnt/user-data/...`会报Permission denied。

bootstrap脚本在可写的HOME下创建真实目录。

然后用best-effort的`sudo -n`把`/mnt/user-data`软链到HOME。

`sudo -n`是非交互模式。

非交互模式是为了避免卡在密码提示上。

sudo不可用时软链这步跳过。

文件API靠home重映射照常工作。

bootstrap是best-effort的。

bootstrap失败只打警告，不抛错。

`release`释放沙箱。

释放的microVM不终止，放进温池继续运行。

`_reclaim_warm_pool`回收温池沙箱。

回收前先做健康检查。

健康检查执行`echo ok`看输出。

不健康的死沙箱会被销毁。

`shutdown`清理所有沙箱。

配置项从`get_app_config().sandbox`读取。

Tenki的配置键是`extra="allow"`的额外键。

配置包括api_key、base_url、image、workspace_id、cpu_cores、memory_mb、replicas、idle_timeout、max_duration、sticky、home_dir、environment。

`max_duration`默认4小时。

Tenki默认约30分钟就会终止沙箱。

默认30分钟会让长会话的状态悄悄丢失。

所以DeerFlow把生命周期拿过来自己管。

用4小时的max_duration，让温池的idle_timeout负责回收。

`sticky`默认关闭。

sticky是把microVM钉在宿主机上。

sticky只在配合暂停恢复时才有意义。

Tenki 1.x删除了projects层。

配置里残留的`project_id`会被忽略并打警告。

workspace自动选择的条件是账户里恰好只有一个workspace。

否则报错让运维显式配置`workspace_id`。

SDK也是懒加载的。

`_import_client`只在provider被选用时导入`tenki_sandbox`模块。

### 2、`TenkiSandbox`

`TenkiSandbox`定义在`sandbox.py`里。

这个类是单个沙箱的适配器。

这个类继承DeerFlow的`Sandbox`基类。

这个类包住一个活的`tenki_sandbox.Sandbox`会话。

Tenki的SDK是同步的。

所以这个适配器直接调用SDK，没有事件循环桥接。

这个类声明`persistent_shell_sessions = False`。

每次执行都是一次新的`sh -lc`。

命令之间不保留shell状态。

这个类实现的方法如下。

`execute_command`执行shell命令。

命令通过`sh -lc`运行。

输出是stdout加stderr。

非零退出码附加`Exit Code: N`到输出。

每次执行前不强制cwd。

文件寻址用绝对的重映射路径，所以cwd无关紧要。

`read_file`用Tenki原生`sandbox.fs`的`read_text`。

`write_file`和`update_file`用`fs.write_stream`上传。

上传按1MB分帧。

append模式是读改写。

Tenki的写流没有append模式。

写流从偏移0开始。

所以append先读旧内容再整体写回。

读改写用`_write_lock`串行化。

两个并发append如果不串行化会互相覆盖。

`download_file`下载文件。

限制单文件100MB。

限制按实际收到的字节数算。

文件传输中途变大也超不过上限。

下载时刻意不持有实例锁。

下载最多100MB，持有锁会阻塞这个沙箱上的所有其他工具。

`list_dir`、`glob`、`grep` shells出去执行`find`和`grep`。

Tenki的fs API是单层的，没有内容搜索。

搜索命令只用busybox可移植的flag。

所以任何Tenki基础镜像都能工作。

路径安全方面有两层。

`_guard_traversal`拒绝包含`..`的路径穿越。

`_resolve_path`把`/mnt/user-data`虚拟前缀重映射到沙箱内的可写HOME。

`_virtual_path`是逆向映射。

所有返回路径的方法用`_virtual_path`报告虚拟前缀形式。

这样结果可以直接喂回其他文件API。

`close`终止底层Tenki会话。

close是幂等的。

microVM先终止，适配器后标记closed。

终止失败时保持可重试状态。

不静默漏掉一个还在计费的沙箱。

错误处理方面，这个类定义了终态错误。

终态错误包括`SessionTerminatedError`、`SessionNotFoundError`、`InvalidStateError`、`StreamClosedError`。

这些错误名按字符串匹配。

按字符串匹配是为了让本模块不用装`tenki`就能导入。

连接断开、管道断裂、EOF也算终态。

遇到终态错误触发`_note_failure`回调。

回调指向provider的`_invalidate_sandbox`。

provider驱逐死沙箱，下次获取冷启动重建。

exec不做自动重试。

exec不是幂等的。

重跑命令有双重副作用的风险。

### 3、`_frames`等辅助函数

`_frames`把字节切成1MB的上传帧。

`_bootstrap_script`生成bootstrap脚本。

`_import_client`懒加载SDK。

## 三、它和谁协作

### 1、依赖的上游

这个包依赖Tenki的Python SDK。

发行包名是`tenki`，提供`tenki_sandbox`模块。

这个依赖是可选的，通过`pip install "deerflow-harness[tenki]"`安装。

这个包依赖DeerFlow的核心模块。

依赖`deerflow.config`读配置。

依赖`deerflow.sandbox`的基类、远程搜索命令、解析器、串行化工具。

依赖`deerflow.config.paths`的`VIRTUAL_PATH_PREFIX`。

依赖同级的`warm_pool_lifecycle`模块。

### 2、服务的下游

这个包被DeerFlow的沙箱中间件调用。

启用方式是`config.yaml`里`sandbox.use: deerflow.community.tenki:TenkiSandboxProvider`。

Tenki的专属配置键在`deerflow/config/sandbox_config.py`的声明里没有显式列出。

这些键靠`SandboxConfig`的`extra="allow"`透传。

这个包需要Tenki云服务可达。

认证用api_key，来自配置或`TENKI_API_KEY`/`TENKI_AUTH_TOKEN`环境变量。

## 四、重要性评级

评级：6分。

理由如下。

这个包是完整的沙箱后端实现。

沙箱能力本身对AI代理很重要。

这个包的实现质量高。

孤儿microVM终止、温池健康检查、append锁、下载锁取舍、busybox可移植flag都有细致处理。

代码注释解释了大量设计取舍。

max_duration默认4小时的设计尤其说明了对云计费风险的考虑。

但是这个包的定位是可选社区贡献。

DeerFlow默认不用Tenki。

Tenki相比OpenSandbox、E2B等也是较新的选择。

`sandbox_config.py`里没有显式声明Tenki的配置键，文档化程度弱于OpenSandbox。

不用Tenki的用户完全不需要这个包。

所以评级定为6分：实现完整可靠，但属于较边缘的可选沙箱后端。
