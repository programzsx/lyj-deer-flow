# deerflow.community.aio_sandbox.local_backend

## 一、这个模块是干什么的

这个模块是沙箱供应的本地容器后端。

背景是这样的。

AIO沙箱跑在容器里。

容器在本机管理。

本机可以是Docker。

本机也可以是Apple Container。

这个后端管本地容器的生命周期。

它管什么。

管容器创建。

管容器销毁。

管端口分配。

管跨进程的容器发现。

受限模式的复杂度在这里。

受限沙箱有两个网络。

一个是内部网络。

沙箱只能通过它访问代理。

一个是出站网络。

只有代理sidecar能出站。

受限沙箱的标签匹配也在它里面。

容器标签记录了配置摘要。

配置变了，发现时能检测出不匹配。

不匹配的沙箱标记为需要替换。

shell容量检查也在它里面。

容器有shell会话数上限。

不满足就要求替换。

## 二、模块里的主要成员

- LocalContainerBackend：本地容器后端类。实现SandboxBackend契约。
- create：创建沙箱。包括容器、网络、sidecar。
- _start_restricted_sandbox：启动受限沙箱。创建两个网络。
- _start_network_proxy：启动网络代理sidecar。
- _create_internal_network、_create_egress_network：创建沙箱网络。
- destroy：销毁沙箱。容器、sidecar、网络一起销毁。
- is_alive：通过Docker检查容器状态。
- discover：按id发现容器。跨进程的Docker发现。
- list_running：列出运行中的沙箱。
- _detect_runtime：检测容器运行时。Docker或Apple Container。
- _has_compatible_shell_capacity：检查shell容量。
- _network_matches_policy：检查网络是否匹配策略。
- _persisted_sandbox_mode：从容器标签读出持久化的模式。
- consume_network_policy_events、decide_network_policy_request：网络策略事件的消费和审批。
- _batch_inspect：批量检查容器。

## 三、它和谁协作

- 它实现community/aio_sandbox/backend的SandboxBackend契约。
- 它依赖network_proxy启动代理sidecar。
- 它依赖sandbox_info传递沙箱元数据。
- 它被aio_sandbox_provider组合使用。
- 它通过subprocess调Docker CLI。

## 四、重要性评级

评级是8分。

理由是它是本地模式容器的实际管理者。

容器创建、销毁、发现都在它里面。

受限沙箱的网络隔离靠它实现。

跨进程发现支撑多实例部署。

它是本地容器模式的核心。

它出错就是沙箱不可用。
