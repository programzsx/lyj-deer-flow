# deerflow.community.aio_sandbox.aio_sandbox_provider

## 一、这个模块是干什么的

这个模块是AIO沙箱的提供者。

背景是这样的。

AIO沙箱是容器沙箱。

容器的创建、销毁、复用需要有人编排。

这个提供者就是编排者。

它组合两个东西。

一个是SandboxBackend。

回答"沙箱怎么供应"。

后端有本地容器和远程K8s两种。

提供者自己管什么。

管进程内缓存。

管空闲超时。

管优雅关闭。

管挂载计算。

它还有一套复杂的所有权逻辑。

多实例部署时多个Gateway共享容器。

每个实例有自己的内存暖池。

没有共享的所有权状态。

一个实例的启动对账会认走别的实例正在用的容器。

然后把它空闲销毁。

别的实例的工具调用就会失败。

所以有共享的ownership store。

这个模块负责发布、认领、续租所有权。

还有暖池逻辑。

释放的沙箱容器还在跑。

放回暖池。

下次同线程的回合直接复用。

不用冷启动。

## 二、模块里的主要成员

- AioSandboxProvider：AIO沙箱提供者。继承SandboxProvider。
- acquire相关方法：获取沙箱。走确定性的沙箱id。
- _deterministic_sandbox_id：按用户和线程构造确定性沙箱id。同一线程永远落回同一容器。
- _publish_ownership：发布所有权。走ownership store。
- _claim_ownership：认领所有权。销毁用的认领要求容器无主或已属于自己。
- _refresh_ownership：续租所有权。
- _reconcile_orphans：对账孤儿容器。认走租约过期的容器。
- _replace_incompatible_sandbox：替换配置不兼容的沙箱。有替代宽限期。
- _reserve_local_teardown、_finish_local_teardown：本进程的销毁预约。
- _cleanup_idle_resources：清理空闲资源。
- _start_lease_renewal、_lease_renewal_loop：租约续租线程。
- _get_thread_mounts、_get_skills_mounts：计算线程和技能挂载。
- _get_lark_cli_runtime_mounts：计算Lark CLI运行时挂载。
- 暖池相关的状态和方法。复用和回收容器。

## 三、它和谁协作

- 它实现SandboxProvider抽象。
- 它创建AioSandbox实例。
- 它依赖SandboxBackend供应容器。本地后端和远程后端。
- 它依赖ownership store做共享所有权。
- 它依赖integrations/lark_cli准备Lark挂载。
- 它被sandbox/middleware和工具层消费。

## 四、重要性评级

评级是9分。

理由是它是容器沙箱的总编排者。

容器生命周期、所有权、暖池、挂载全部汇聚在这里。

多实例部署的正确性依赖它的所有权逻辑。

它是这个子目录里最复杂的文件。

它出错会导致容器误删、工具调用失败。
