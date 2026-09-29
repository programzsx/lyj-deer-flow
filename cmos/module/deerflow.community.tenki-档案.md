# deerflow.community.tenki 档案

## 一、这个模块是干什么的

这个包是Tenki云沙箱提供者。

Tenki是一个云沙箱服务。

这个包把Tenki云沙箱集成到DeerFlow的Sandbox和SandboxProvider契约后面。

每个沙箱是隔离的云微型虚拟机。

虚拟机从标准基础镜像创建。

完整契约都实现了。

命令执行是`execute_command`。

文件操作是read_file、write_file、update_file、download_file、list_dir、glob、grep。

文件传输用Tenki原生的`sandbox.fs` API。

搜索在沙箱里调`find`和`grep`。

配置示例在config.yaml里。

用户配置`sandbox.use: deerflow.community.tenki:TenkiSandboxProvider`。

可配项包括API key、base_url、镜像、workspace_id、CPU、内存、副本数、空闲超时、最长生命周期、sticky、home目录、环境变量。

使用前装可选SDK。

命令是`pip install "deerflow-harness[tenki]"`。

## 二、模块里的主要成员

### 1、导出的类

`TenkiSandbox`是沙箱实现。

实现Sandbox契约。

`TenkiSandboxProvider`是提供者实现。

实现SandboxProvider契约。

### 2、sticky选项的注意事项

sticky把微型虚拟机固定到宿主机。

这只在pause和resume时重要。

环境变量的值必须保持字符串。

Tenki的sticky处理有个已知注意事项。

环境变量值是字符串。

布尔值要在SDK调用前解析。

`bool("false")`是True。

直接把字符串传给SDK会出错。

### 3、刻意不用的Tenki特性

只使用稳定的Tenki表面。

沙箱创建和终止。

exec、shell、文件系统。

卷、快照、模板构建刻意不用。

这样不需要预烘焙镜像。

不需要不稳定的Tenki特性。

## 三、它和谁协作

### 1、它依赖谁

它依赖Tenki的SDK。

这是可选extra。

它依赖Tenki云服务。

这需要API key。

### 2、谁调用它

配置系统按`sandbox.use`选择这个提供者。

沙箱中间件通过SandboxProvider契约获取沙箱。

harness的沙箱工具通过Sandbox契约执行操作。

## 四、重要性评级

### 1、评级

4分。

### 2、理由

这个包是沙箱后端生态的一个选项。

Tenki是托管云沙箱。

用户不用维护容器基础设施。

选了它的部署完全依赖它。

它的设计有一个稳妥的决定。

只用稳定的Tenki表面。

不用卷、快照、模板构建。

这样上游变化不会破坏集成。

sticky的字符串布尔值是个真实的坑。

文档里专门提醒。

它是可选组件。

默认部署不用它。

文档详尽。

实现是标准契约封装。

所以评4分。
