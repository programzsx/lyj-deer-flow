# deerflow.community.aio_sandbox.remote_backend

## 一、这个模块是干什么的

这个模块是沙箱供应的远程后端。

背景是这样的。

AIO沙箱可以跑在远程的K8s集群里。

远程模式需要一个provisioner服务。

provisioner负责实际创建Pod。

这个后端把Pod生命周期委托给provisioner。

架构是这样的。

后端通过HTTP调用provisioner。

provisioner通过K8s API在k3s里创建Pod和NodePort服务。

后端直接通过k3s的NodePort访问沙箱Pod。

这个后端实现SandboxBackend契约。

create、destroy、is_alive、discover、list_running都委托给provisioner。

## 二、模块里的主要成员

- RemoteSandboxBackend：远程后端类。实现SandboxBackend契约。
- create：创建沙箱。调用provisioner的创建接口。
- destroy：销毁沙箱。调用provisioner的销毁接口。
- is_alive：判断沙箱是否存活。
- discover：按id发现沙箱。
- list_running：列出运行中的沙箱。
- _provisioner_create、_provisioner_destroy、_provisioner_is_alive、_provisioner_discover、_provisioner_list：provisioner的HTTP调用。
- _auth_headers：认证头。
- _requires_shell_capacity_replacement：判断shell容量是否需要替换。
- provisioner_url属性：provisioner的地址。

## 三、它和谁协作

- 它实现community/aio_sandbox/backend的SandboxBackend契约。
- 它和provisioner服务通信。
- 它被aio_sandbox_provider组合使用。
- 它依赖sandbox_info传递沙箱元数据。

## 四、重要性评级

评级是5分。

理由是它是远程模式沙箱的供应通道。

K8s部署依赖它。

它把Pod生命周期委托给provisioner，自己只做HTTP调用。

逻辑相对薄。

但它是远程部署的必需环节。
