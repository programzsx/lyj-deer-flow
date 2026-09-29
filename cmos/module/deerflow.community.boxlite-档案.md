# deerflow.community.boxlite 档案

## 一、这个模块是干什么的

这个包是BoxLite微型虚拟机沙箱后端。

BoxLite是一个无守护进程的OCI原生微型虚拟机运行时。

Linux上用libkrun和KVM。

macOS上用Hypervisor.framework。

这个包把BoxLite集成到DeerFlow的Sandbox和SandboxProvider契约后面。

每个沙箱是一个硬件隔离的虚拟机。

虚拟机有自己的内核。

虚拟机可以原样运行任何OCI镜像。

这是issue #3936引入的。

配置示例在config.yaml里。

用户配置`sandbox.use: deerflow.community.boxlite:BoxliteProvider`。

可配项包括镜像、内存上限、vCPU数、副本数、空闲超时、环境变量。

使用前要装可选运行时。

命令是`pip install "deerflow-harness[boxlite]"`。

宿主要求。

Linux主机需要KVM。

DeerFlow自己跑在云虚拟机里时需要嵌套虚拟化。

macOS用Hypervisor.framework。

## 二、模块里的主要成员

### 1、导出的类

`BoxliteBox`是沙箱实现。

实现Sandbox契约。

`BoxliteProvider`是提供者实现。

实现SandboxProvider契约。

### 2、实现的契约

完整契约都实现了。

命令执行是`execute_command`。

文件操作是read_file、write_file、update_file、download_file、list_dir、glob、grep。

文件操作以shell命令的形式在box里跑。

## 三、它和谁协作

### 1、它依赖谁

它依赖BoxLite运行时。

这是可选extra。

它依赖OCI镜像作为沙箱基础。

### 2、谁调用它

配置系统按`sandbox.use`选择这个提供者。

沙箱中间件通过SandboxProvider契约获取沙箱。

harness的沙箱工具通过Sandbox契约执行操作。

## 四、重要性评级

### 1、评级

5分。

### 2、理由

这个包是沙箱系统的第三种形态。

DeerFlow支持多种沙箱后端。

AIO、E2B、BoxLite、Tenki、OpenSandbox。

BoxLite的特点是硬件隔离。

虚拟机有自己的内核。

隔离强度高于容器。

它也是可选组件。

默认部署不用它。

需要装extra和KVM。

对需要强隔离的用户有价值。

它是沙箱后端生态的一个选项。

不选它时系统照常工作。

所以评5分。
