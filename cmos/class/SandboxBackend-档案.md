# SandboxBackend档案

## 一、这个类是干什么的

这个类是backend.py模块里的抽象基类。

这个类继承自abc.ABC。

这个类定义沙箱供给后端的抽象接口。

这个类回答一个问题。

这个问题是"沙箱是怎么被创建出来的"。

具体实现有两种。

LocalContainerBackend在本机用Docker或Apple Container启动容器。

RemoteSandboxBackend连接一个已存在的URL。

URL由provisioner服务在K8s里动态创建。

这个类还包含三个模块级函数。

这些函数和这个类一起构成backend模块的公共面。

sandbox_http_trust_env判断沙箱HTTP客户端是否继承代理设置。

本地Docker和K8s沙箱端点是控制面连接。

走HTTP_PROXY可能产生误导性的502。

wait_for_sandbox_ready轮询沙箱健康端点直到就绪或超时。

这个是同步版本。

wait_for_sandbox_ready_async是异步版本。

异步版本给异步运行时路径用。

不会阻塞事件循环。

这个类在什么场景被使用。

场景是AioSandboxProvider选择并组合一个backend。

provider把"怎么供给容器"的细节全部委托给backend。

provider自己只管生命周期编排。

## 二、类的成员

这个类定义了四个抽象方法和一个具体方法。

create是抽象方法。

create创建或供给一个新沙箱。

参数包括thread_id、sandbox_id、extra_mounts。

extra_mounts是额外的卷挂载三元组列表。

三元组是（宿主机路径、容器路径、是否只读）。

关键字参数有user_id、provision_lark_cli_runtime、provision_lark_cli_broker。

provision_lark_cli_runtime让backend供给lark-cli运行时。

provision_lark_cli_broker让backend供给lark-cli broker边车。

broker模式让凭证离开沙箱容器。

create返回带连接详情的SandboxInfo。

destroy是抽象方法。

destroy销毁沙箱并释放资源。

is_alive是抽象方法。

is_alive快速检查沙箱是否还活着。

is_alive应该是轻量检查。

例如容器inspect。

不是完整的健康检查。

discover是抽象方法。

discover按确定性ID寻找已存在的沙箱。

discover用于跨进程恢复。

另一个进程启动的沙箱可以通过确定性容器名或URL被找到。

返回SandboxInfo或None。

SandboxInfo可能带requires_replacement=True。

表示backend识别出不兼容的持久化供给策略。

list_running是具体方法。

list_running枚举backend管理的所有运行中沙箱。

默认实现返回空列表。

这对不管理本地容器的backend是正确的。

list_running用于启动对账。

进程重启后需要发现之前进程启动的容器。

三个模块级函数前面已经讲过。

## 三、它和谁协作

它是AIO沙包子包backend层的接口中心。

LocalContainerBackend继承它。

RemoteSandboxBackend继承它。

AioSandboxProvider组合它。

provider通过_create_backend按配置创建具体实现。

provider调用create、destroy、is_alive、discover、list_running。

SandboxInfo是它的返回类型。

所有接口方法都传递SandboxInfo。

wait_for_sandbox_ready被LocalContainerBackend.discover调用。

wait_for_sandbox_ready_async被provider的异步创建路径调用。

sandbox_http_trust_env被两个等待函数和AioSandbox使用。

## 四、重要性评级（1-10分+理由）

评级是7分。

理由如下。

这个类是沙箱供给的抽象边界。

provider的全部生命周期逻辑建立在这五个方法之上。

多态让本地模式和远程K8s模式共享同一套provider代码。

没有这个抽象。

provider要写两套if-else分支。

代码复杂度会大幅上升。

新增backend类型也没有扩展点。

它的两个具体实现被provider选择使用。

SandboxInfo贯穿全部接口。

三个模块级函数被多个文件复用。

删除它等于删除供给层的扩展能力。

评级给7分。
