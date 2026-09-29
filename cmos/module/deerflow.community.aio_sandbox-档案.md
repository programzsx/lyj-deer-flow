# deerflow.community.aio_sandbox 档案

## 一、这个模块是干什么的

这个包是AIO沙箱的公共入口。

AIO沙箱是DeerFlow沙箱系统的一个社区提供者。

这个包把沙箱实现的主要类导出。

DeerFlow的沙箱系统有两层契约。

一层是`Sandbox`。

一层是`SandboxProvider`。

Sandbox代表一个可执行的隔离环境。

SandboxProvider负责创建和管理沙箱。

这个包在AIO运行时上实现这两层契约。

AIO运行时支持本地容器和远程沙箱两种形态。

沙箱是按线程隔离的。

每个线程有自己的沙箱。

智能体的bash命令、文件操作都在沙箱里跑。

## 二、模块里的主要成员

### 1、导出的类

这个包导出六个类。

`AioSandbox`是沙箱实现。

实现Sandbox契约。

`AioSandboxProvider`是提供者实现。

实现SandboxProvider契约。

创建和管理沙箱。

`SandboxBackend`是后端抽象。

定义本地和远程后端的公共接口。

`LocalContainerBackend`是本地容器后端。

在本地Docker容器里跑沙箱。

`RemoteSandboxBackend`是远程后端。

在远程AIO沙箱服务里跑。

`SandboxInfo`是沙箱信息模型。

描述一个沙箱的元数据。

## 三、它和谁协作

### 1、它依赖谁

它依赖包内的`sandbox.py`、`provider.py`、`backend.py`等子模块。

它依赖AIO沙箱的运行时。

本地形态依赖Docker。

远程形态依赖AIO沙箱服务的API。

### 2、谁调用它

配置系统按`config.yaml`的`sandbox.use`选择这个提供者。

用户配置`sandbox.use: deerflow.community.aio_sandbox:AioSandboxProvider`。

沙箱中间件通过SandboxProvider契约获取沙箱。

harness的沙箱工具通过Sandbox契约执行命令和文件操作。

子包`ownership`提供跨实例所有权租约。

多worker部署共享容器时用。

## 四、重要性评级

### 1、评级

7分。

### 2、理由

这个包是AIO沙箱形态的入口。

DeerFlow的核心能力之一是沙箱执行。

智能体的所有代码运行都在沙箱里。

沙箱隔离保证智能体的操作不伤害宿主。

AIO是沙箱系统的主要形态之一。

选了AIO的用户完全依赖这个包。

它对外暴露的契约设计清晰。

Sandbox和SandboxProvider两层。

配置切换提供者不需要改其他代码。

它是可选组件。

选本地或其他沙箱形态时这个包不参与。

所以评7分。
