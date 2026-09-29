# LocalContainerBackend档案

## 一、这个类是干什么的

这个类是local_backend.py模块的本地容器后端实现。

这个类继承自SandboxBackend抽象类。

这个类在本机管理沙箱容器。

运行时有两个。

Docker或Apple Container。

macOS上自动优先用Apple Container。

Apple Container不可用就退回Docker。

其他平台一律用Docker。

这个类的功能docstring里列了四条。

确定性容器命名，用于跨进程发现。

线程安全的端口分配工具。

容器生命周期管理，启动和停止配合--rm。

支持卷挂载和环境变量注入。

这个类解决的问题很明确。

DeerFlow的沙箱需要一个真实的容器来执行代码。

本地部署时，这个容器由这个类直接启动、停止、发现、销毁。

这个类还有一个大特性。

受限网络模式。

open模式是传统模式，容器直接发布端口。

restricted模式给每个沙箱建一套隔离网络。

这套隔离资源包括沙箱容器、代理sidecar、内网、出网四个部分。

受限模式的复杂度占了这个类的大部分代码。

## 二、类的成员

构造函数接收六个关键字参数。

image是容器镜像。

base_port是端口搜索的起始端口号。

container_prefix是容器名前缀。

config_mounts是配置层的卷挂载。

environment是要注入容器的环境变量。

network_config是网络配置。

network_config里mode是open或restricted。

restricted模式要求Docker且要求Docker Engine 28以上。

runtime是property，返回检测到的运行时。

network_mode是property，返回当前网络模式。

_STOP_TIMEOUT_SECONDS类常量是120秒。

这是单次停止的墙钟上限。

超过说明守护进程卡死了。

接口实现方法有五个。

create方法启动新容器并返回连接信息。

create有一个端口重试循环。

Docker拒绝端口时跳过换下一个。

容器名冲突时尝试发现并采纳现有容器。

受限模式下先申请中继令牌再走受限启动路径。

create返回SandboxInfo。

受限模式返回的SandboxInfo带中继认证头。

destroy方法停止容器并释放端口。

destroy还会清理受限模式的sidecar和网络。

is_alive方法轻量检查容器是否运行。

is_alive不发HTTP。

受限模式还会检查代理sidecar和网络状态。

discover方法按确定性容器名发现已有容器。

discover返回SandboxInfo或None。

不兼容的持久化策略返回requires_replacement=True。

瞬时的运行时错误返回None。

list_running方法枚举所有匹配前缀的运行容器。

list_running用一次ps加批量inspect。

批量inspect把子进程调用次数从2N+1降到2到3次。

无可用端口的容器也会带requires_replacement=True返回。

受限模式资源方法。

_restricted_resources_status判断资源集是missing、compatible还是mismatch。

_start_restricted_sandbox启动受限沙箱。

启动失败会清理资源。

_existing兼容时抛_ExistingRestrictedSandbox。

_create_internal_network创建内网。

内网是bridge驱动、internal、双栈网关隔离。

_create_egress_network创建出网。

出网是bridge驱动、非internal、禁ICC。

_start_network_proxy启动代理sidecar。

代理sidecar的资源限制是256MB内存、1核CPU、128个PID、只读根文件系统。

网络策略摘要方法。

_network_policy_digest计算配置和代理源码的摘要。

摘要写在Docker标签上。

摘要不一致就是策略漂移的信号。

检查辅助方法。

_batch_inspect一次子进程批量检查多个容器。

_inspect_network检查一个网络。

_persisted_sandbox_mode给容器分类而不认领不修改。

_has_compatible_shell_capacity检查会话容量是否够用。

_require_restricted_network_support校验Docker版本。

容器操作方法。

_start_container组装并执行运行命令。

安全加固包括删全部能力、加少量兼容能力、禁提权、内存CPU PID限制、seccomp配置。

_stop_container停止容器，超时120秒。

_is_container_running检查容器运行状态。

检查失败和"容器不存在"是刻意区分的。

失败抛异常，调用方不会误销毁健康容器。

_get_container_port取容器的宿主机端口。

网络策略事件方法。

consume_network_policy_events读取代理记录的拒绝事件。

deny_pending_network_policy_events拒绝全部未上报事件。

decide_network_policy_request对事件做决定。

决定有三种。

deny。

allow_temporary，带TTL。

allow_sandbox，永久。

模块级辅助函数很多。

时间戳解析、端口提取、挂载格式化、命令脱敏、IPv6规范化、bind地址解析、网络目标解析、资源限制解析等。

## 三、它和谁协作

它继承自SandboxBackend。

它实现全部四个抽象方法并覆写list_running。

AioSandboxProvider在默认（非provisioner）配置下创建它。

provider调用它的全部接口方法。

它调用deerflow.utils.network的get_free_port和release_port做端口管理。

它调用backend.py模块的wait_for_sandbox_ready做健康检查。

它使用network_proxy.py的RELAY_AUTH_HEADER和RELAY_TOKEN_ENV常量。

它产出SandboxInfo对象。

受限模式通过docker exec操作network_proxy.py脚本。

它和network_proxy.py是启动与被复制的协作关系。

代理脚本被复制进sidecar容器运行。

它产出_ContainerInspection和_NetworkInspection作为内部检查结果。

它抛出_ExistingRestrictedSandbox作为内部控制流信号。

## 四、重要性评级（1-10分+理由）

评级是9分。

理由如下。

这个类是本地部署模式下沙箱容器的直接管理者。

全部容器生命周期由它落地。

启动、停止、发现、枚举、销毁。

没有它。

本地模式的沙箱无法创建。

agent的代码执行没有载体。

DeerFlow的单机部署和开发环境全部失效。

它是两个backend实现中默认的那个。

provider不配provisioner_url就用它。

覆盖面最广。

它还承载了受限网络模式。

这个模式是沙箱安全的核心。

网络隔离、策略摘要、代理sidecar全部在这里编排。

它的复杂度接近2000行。

子进程调用、错误分类、跨进程发现的设计都很精细。

删除它等于删除本地沙箱供给能力。

评级给9分。
