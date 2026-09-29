# RemoteSandboxBackend档案

## 一、这个类是干什么的

这个类是remote_backend.py模块里的沙箱供给后端实现。

这个类继承自SandboxBackend。

这个类把Pod生命周期委托给provisioner服务。

架构是这样的。

backend通过HTTP调用provisioner。

provisioner通过K8s API调用k3s。

provisioner为每个sandbox_id动态创建Pod和NodePort Service。

backend直接通过k3s:NodePort访问沙箱Pod。

这个类本身是一个薄的HTTP客户端。

Pod的创建、销毁、发现全部由provisioner处理。

这个类的典型配置在config.yaml里。

sandbox.use指向AioSandboxProvider。

sandbox.provisioner_url指向provisioner服务。

sandbox.provisioner_api_key是API密钥。

这个类在什么场景被使用。

场景是K8s或provisioner模式部署。

本地Docker模式跑不动或规模不够时用这个模式。

provider的_create_backend检测到provisioner_url配置就选它。

## 二、类的成员

构造函数接收四个参数。

provisioner_url是provisioner服务地址。

api_key是每次请求携带的X-API-Key头。

api_key为空就不发认证头。

max_shell_sessions是转发给每个沙箱Pod的会话容量。

required_shell_sessions是最低可用容量。

provisioner_url是property，返回服务地址。

create方法创建沙箱Pod加Service。

create调用POST /api/sandboxes。

create会先解析skills容器路径。

create会判断用户是否看到legacy技能。

create构建payload后POST给provisioner。

provisioner返回的沙箱容量不够时create抛RuntimeError。

provisioner没报max_shell_sessions时也抛。

那是版本偏差的信号。

destroy方法调用DELETE /api/sandboxes/{sandbox_id}。

destroy失败只记警告，不抛异常。

is_alive方法检查Pod是否Running。

is_alive调用GET /api/sandboxes/{sandbox_id}。

404返回False。

非OK状态抛RuntimeError。

discover方法发现已存在的沙箱。

discover调用GET /api/sandboxes/{sandbox_id}。

404返回None。

list_running方法返回provisioner管理的全部沙箱。

list_running调用GET /api/sandboxes。

这个方法让provider的孤儿对账能接管之前进程创建的Pod。

没有它，进程重启会静默孤儿化全部K8s Pod。

Pod会永远运行，因为闲置检查只跟踪进程内状态。

还有四个内部辅助方法。

_auth_headers生成认证头。

_requires_shell_capacity_replacement判断已报告容量是否不够。

_provisioner_list、_provisioner_create、_provisioner_destroy、_provisioner_is_alive、_provisioner_discover是HTTP细节层。

模块级辅助_provisioner_extra_mounts_payload过滤provisioner能安全重建的挂载。

_normalize_skills_container_path校验skills容器路径。

## 三、它和谁协作

它继承自SandboxBackend。

它实现全部四个抽象方法并覆写list_running。

AioSandboxProvider在配置了provisioner_url时创建它。

provider调用它的全部接口方法。

它通过requests库同步调用provisioner的REST API。

它导入deerflow的常量、用户上下文、技能存储模块。

DEFAULT_SKILLS_CONTAINER_PATH来自deerflow.constants。

get_effective_user_id来自deerflow.runtime.user_context。

user_should_see_legacy_skills来自deerflow.skills.storage。

它产出SandboxInfo对象。

SandboxInfo带requires_replacement标志。

provider消费这个标志决定是否替换。

## 四、重要性评级（1-10分+理由）

评级是6分。

理由如下。

这个类是K8s部署模式的供给通道。

没有它，DeerFlow只能在本机Docker跑沙箱。

生产级多副本部署依赖它。

它是薄客户端设计。

全部复杂度都在provisioner服务里。

所以这个类的代码量小、职责单一。

它的错误处理有分层。

create和is_alive失败会抛异常。

destroy和discover失败只记日志。

如果删掉这个类。

provisioner模式完全失效。

K8s部署不可用。

但单机Docker部署不受影响。

它是两个backend实现之一。

地位重要但覆盖场景特定。

评级给6分。
