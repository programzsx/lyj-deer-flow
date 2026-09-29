# deerflow.community.aio_sandbox.ownership.factory

## 一、这个模块是干什么的

这个模块解析配置的沙箱所有权存储。

背景是这样的。

所有权存储有契约。

契约有两种实现。

一种是进程内的。

适合单实例部署。

一种是Redis的。

适合多实例部署。

调用方需要一个可用的实现。

这个模块负责选择和构建。

选择方式是按配置的type分发。

每个分支的导入是懒的。

只用memory的安装永远不会导入redis。

还有一个环境变量的逃生口。

容器部署可以用环境变量切换后端。

不用改config.yaml。

这个模块还有一个智能推断。

配置里stream桥已经指向Redis的部署必然是多实例。

这种部署自动得到Redis的所有权存储。

而不是静默地用进程内的。

这个模块还生成实例的owner id。

owner id是每个实例的。

不是每台主机的。

同一台主机上的两个Gateway worker必须能区分各自的租约。

## 二、模块里的主要成员

- generate_owner_id()：生成实例唯一的id。格式是hostname:hex。
- resolve_ownership_config(config, stream_bridge)：补全省略的所有权配置。stream桥指向Redis的部署自动得到redis存储。
- _ENV_OWNERSHIP_REDIS_URL：所有权Redis地址的环境变量。
- _ENV_STREAM_BRIDGE_REDIS_URL：stream桥Redis地址的环境变量。
- 按配置type分发到memory或redis实现。分支导入是懒的。

## 三、它和谁协作

- 它依赖community/aio_sandbox/ownership/base的契约。
- 它按需加载ownership/memory.py和ownership/redis.py。
- 它被aio_sandbox_provider调用。提供者构造时解析所有权配置。
- 它依赖sandbox_config和stream_bridge_config读取配置。

## 四、重要性评级

评级是4分。

理由是它是所有权存储的接入点。

stream桥推断的设计防住了多实例部署的静默错配。

owner id的每实例设计让worker能区分租约。

但它是薄薄的一层工厂。

实际逻辑在两个实现里。
