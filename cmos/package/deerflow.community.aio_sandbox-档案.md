# deerflow.community.aio_sandbox档案

本文档解读deerflow.community.aio_sandbox这个包。

本文档基于对该包目录下全部代码文件的实际阅读。

本文档的读者是想理解这套沙箱实现的开发者。

## 一、这个包是干什么的

这个包是AIO沙箱的工具集成。

AIO沙箱是agent-infra/sandbox这个项目提供的Docker容器。

DeerFlow是一个AI超级代理系统。

AI代理需要执行代码。

AI代理需要操作文件。

这些操作不能直接在Gateway主机上做。

这些操作要放到隔离的沙箱里做。

这个包就是DeerFlow和AIO沙箱容器之间的桥梁。

这个包负责三件大事。

第一件是创建和销毁沙箱容器。

第二件是在沙箱里执行命令和读写文件。

第三件是管理沙箱的生命周期，包括预热池、空闲回收、跨实例所有权。

这个包是社区工具包里最重的包。

这个包的代码量接近一万行。

## 二、包里的主要成员

### 1、AioSandbox

AioSandbox是沙箱的运行时实现。

AioSandbox继承自deerflow.sandbox.sandbox.Sandbox。

AioSandbox通过HTTP API和AIO沙箱容器通信。

AioSandbox的主要方法如下。

execute_command执行一条shell命令。

execute_command_in_scope为子代理运行提供独立的shell会话。

read_file读取沙箱里的文件。

download_file下载文件的二进制内容。

write_file写入文本文件。

update_file写入二进制文件。

list_dir列出目录内容。

glob按模式搜索文件。

grep在文件里搜索内容。

AioSandbox有两条命令执行路径。

第一条是传统持久shell路径。

这条路径复用同一个shell会话。

shell状态会从一条命令带到下一条命令。

第二条是bash.exec路径。

这条路径用于带环境变量的命令。

每条命令用全新会话。

秘密只作用于单条命令。

AioSandbox处理了很多会话损坏的场景。

并发调用会让AIO容器的隐式持久shell损坏。

损坏时会返回ErrorObservation而不是真实输出。

AioSandbox检测到损坏后会换新会话重试。

AioSandbox还会对旧版镜像快速失败。

旧版镜像不支持/v1/bash/exec这个API。

旧版镜像会返回404。

重试没有用。

AioSandbox直接给出面向运维的错误提示。

提示内容是升级all-in-one-sandbox镜像到1.9.3以上。

AioSandbox的close方法负责关闭宿主机侧的HTTP客户端。

agent_sandbox这个SDK是自动生成的。

SDK自身没有close方法。

AioSandbox穿透SDK的属性链找到真正的httpx.Client。

关闭它以释放连接池里的socket。

### 2、SandboxBackend

SandboxBackend是沙箱供应后端的抽象基类。

SandboxBackend定义了五个核心方法。

create创建一个新沙箱。

destroy销毁沙箱并释放资源。

is_alive快速检查沙箱是否存活。

discover按确定性ID发现已存在的沙箱。

list_running枚举所有运行中的沙箱。

discover和list_running支撑跨进程恢复。

另一个进程启动的沙箱可以被本进程发现并接管。

枚举必须是只读的。

枚举不能销毁资源。

销毁的决策权在Provider手里。

backend.py里还有两个辅助函数。

wait_for_sandbox_ready轮询沙箱的健康检查端点。

wait_for_sandbox_ready_async是它的异步版本。

sandbox_http_trust_env决定HTTP客户端是否继承代理设置。

本地Docker和K8s端点是控制面连接。

这些连接不该走HTTP_PROXY。

走代理会产生误导性的502。

### 3、LocalContainerBackend

LocalContainerBackend是本地容器后端。

这个后端直接管理Docker或Apple Container。

macOS上优先使用Apple Container。

macOS上没有Apple Container就回退到Docker。

其他平台使用Docker。

这个后端的特点如下。

容器名字是确定性的。

确定性名字让跨进程发现成为可能。

端口分配是线程安全的。

容器用--rm方式启动和停止。

支持卷挂载和环境变量注入。

create方法里有一个重试循环。

Docker可能拒绝端口。

端口被占用就换下一个端口重试。

容器名冲突时会尝试发现并接管已有容器。

这个后端还支持受限网络模式。

受限模式下会创建内部网络。

受限模式下会启动一个网络代理sidecar。

容器会带 deerflow-sandbox 前缀的标签。

标签用于识别哪些容器是DeerFlow管理的。

### 4、RemoteSandboxBackend

RemoteSandboxBackend是远程沙箱后端。

这个后端把Pod生命周期委派给provisioner服务。

provisioner在k3s里动态创建Pod和NodePort Service。

后端通过k3s:{NodePort}直接访问沙箱Pod。

这个后端不管理本地容器。

它的list_running返回空列表。

远程生命周期由provisioner自己负责清理。

### 5、network_proxy.py

network_proxy.py是受信任的HTTP(S)策略代理。

这个模块会被复制进一个小的sidecar容器里当脚本执行。

这个代理只支持两种请求。

一种是HTTP绝对形式请求。

一种是HTTPS的CONNECT隧道。

其他协议在沙箱的仅内网环境中不可用。

这个代理做的事如下。

先严格解析请求头。

在DNS解析之前拒绝被策略禁止的域名。

然后尝试所有通过验证的解析结果。

解析结果必须全部是公网地址。

被拒绝的请求可以记录到SQLite数据库。

数据库里有events和grants两个表。

记录的拒绝事件会浮出给用户审批。

审批通过的域名会获得临时授权。

授权有TTL。

代理还会读取TLS的Client Hello。

CONNECT隧道要求SNI和目标主机一致。

每个客户端连接只允许一个请求。

这是故意的。

管道化的第二个请求会绕过下一个目标策略检查。

handle_relay处理代理API的转发。

转发需要令牌认证。

令牌用hmac.compare_digest比较。

### 6、AioSandboxProvider

AioSandboxProvider是沙箱生命周期的编排者。

AioSandboxProvider组合了SandboxBackend。

Provider自己负责四件事。

第一件是进程内缓存，让重复访问变快。

第二件是空闲超时管理。

第三件是带信号处理的优雅关闭。

第四件是挂载计算，包括线程专属挂载和技能挂载。

Provider的获取路径有多层。

第一层是进程内缓存。

第二层是预热池。

第三层是后端发现。

第四层是创建新沙箱。

同一个thread_id在多轮、多进程、多Pod之间会得到同一个沙箱ID。

沙箱ID是从用户和线程推导出来的确定性ID。

Provider里有两个后台线程。

一个线程做租约续期。

一个线程做空闲检查。

租约续期和空闲清理是独立的。

禁用空闲清理不等于可以不续租。

不续租会让其他实例接管活着的容器。

Provider启动时会做孤儿调和。

孤儿调和枚举所有带前缀的运行中容器。

真正的孤儿会被收进预热池。

收编必须先拿到所有权租约。

拿不到租约说明另一个实例正在用。

无主容器不能立刻收编。

无主容器要先度过一个恢复宽限期。

宽限期的目的是区分"存储丢了"和"所有者真死了"。

Provider里还有两个重要的保护机制。

一个是_acquire_serializer，串行化对同一个线程的获取操作。

一个是本地teardown预留，配合跨实例teardown租约。

### 7、SandboxInfo

SandboxInfo是沙箱的元数据。

SandboxInfo支撑跨进程发现和状态持久化。

里面存着沙箱ID、URL、容器名、容器ID、创建时间。

request_headers是控制面凭据。

凭据故意不进to_dict和repr。

凭据不能通过元数据持久化或日志泄漏。

### 8、三个异常类

SandboxBeingDestroyedError表示另一个实例正在销毁这个容器。

这个容器不能交给代理用。

SandboxPolicyReplacementDeferredError表示不兼容的沙箱还不能替换。

要等它变成真正的孤儿才能替换。

SandboxIdentityCollisionError表示确定性ID已经记录给了别的用户和线程。

## 三、它和谁协作

这个包依赖的外部组件如下。

- agent_sandbox这个Python SDK，用于和AIO容器通信
- Docker或Apple Container，用于本地容器后端
- provisioner服务和k3s，用于远程后端
- Redis，用于跨实例所有权租约，可选
- deerflow.config，读取沙箱配置
- deerflow.sandbox，复用Sandbox抽象和搜索辅助函数
- deerflow.integrations.lark_cli，技能和凭据挂载
- deerflow.skills，技能投影

这个包被谁调用。

Gateway的沙箱中间件通过SandboxProvider接口调用这个包。

config.yaml里用`sandbox.use: deerflow.community.aio_sandbox:AioSandboxProvider`选择这个Provider。

warm_pool_lifecycle模块为它提供预热池的公共逻辑。

## 四、重要性评级

评级：9分。

理由如下。

沙箱是DeerFlow执行能力的基础。

没有沙箱，代理无法安全地执行代码和操作文件。

aio_sandbox是最完整的沙箱实现。

这个包承担了创建、执行、回收、跨实例协调的全部职责。

这个包的代码量和复杂度都是社区包里最高的。

多实例部署下的所有权租约是关键安全机制。

没有租约，多个Gateway实例会互相销毁对方的活沙箱。

受限网络模式是重要的安全边界。

这些因素让这个包成为社区工具里最重要的一个。

扣1分是因为它是可选依赖。

DeerFlow也可以选择本地文件系统沙箱或e2b。

不选它系统照样能跑。
