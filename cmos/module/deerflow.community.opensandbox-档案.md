# deerflow.community.opensandbox 档案

## 一、这个模块是干什么的

这个包是OpenSandbox社区沙箱提供者。

OpenSandbox是开源沙箱运行时。

这个包在OpenSandbox上实现DeerFlow的Sandbox和SandboxProvider契约。

每个沙箱是OpenSandbox管理的隔离环境。

智能体的命令执行和文件操作都在沙箱里跑。

这是沙箱系统的第五种形态。

DeerFlow支持多种沙箱后端。

AIO、E2B、BoxLite、Tenki、OpenSandbox。

每种形态实现同一套契约。

用户按配置选择。

## 二、模块里的主要成员

### 1、导出的类

`OpenSandboxProvider`是提供者实现。

实现SandboxProvider契约。

负责创建和管理沙箱。

`OpenSandboxSandbox`是沙箱实现。

实现Sandbox契约。

提供命令执行和文件操作。

## 三、它和谁协作

### 1、它依赖谁

它依赖包内的`provider.py`和`sandbox.py`子模块。

它依赖OpenSandbox运行时。

### 2、谁调用它

配置系统按`sandbox.use`选择这个提供者。

用户配置`sandbox.use: deerflow.community.opensandbox:OpenSandboxProvider`。

沙箱中间件通过SandboxProvider契约获取沙箱。

harness的沙箱工具通过Sandbox契约执行操作。

## 四、重要性评级

### 1、评级

4分。

### 2、理由

这个包是沙箱后端生态的一个选项。

OpenSandbox是开源运行时。

用户可以自己部署。

不依赖云服务。

对数据敏感的部署有价值。

选了它的部署完全依赖它。

它是可选组件。

默认部署不用它。

文档很薄。

只有一句包描述。

它实现同一套契约。

行为可预期。

不选它时系统照常工作。

所以评4分。
