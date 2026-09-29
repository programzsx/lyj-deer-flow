# ExtensionManager档案

源码位置：backend/packages/harness/deerflow/extensions/manager.py

## 一、这个类是干什么的

ExtensionManager是扩展安装管理器。

ExtensionManager负责把可信的第三方Python扩展装进一个DeerFlow checkout。它是面向运维人员的安装管理入口。

ExtensionManager的职责有这些。

第一。安装扩展。install方法接收一个来源。来源可以是本地目录，也可以是远程包引用。安装过程包括快照、依赖声明、锁文件、入口点发现、插件记录这一整套。

第二。升级扩展。upgrade方法替换已装的扩展。升级保留扩展的私有配置和启用状态。

第三。启停扩展。set_enabled方法只改enabled标志。配置不动。

第四。卸载扩展。remove方法删除托管分发和插件记录。

第五。列出扩展。list_configured按加载顺序列出配置好的扩展。

安装是快照而不是可编辑链接。本地目录被校验后复制到backend/extensions/sources/目录下。复制时忽略Git元数据、虚拟环境、Python缓存和字节码。复制前拒绝符号链接、路径逃逸的分发名、疑似凭据文件。

整个安装事务非常严谨。事务涉及pyproject.toml、uv.lock、插件配置、源码快照、环境同步。失败时回滚所有文件。回滚不是盲目的。回滚前检测并发的外部编辑。检测到并发编辑就保留编辑并报错。

## 二、类的成员

（一）字段

- project_root：项目根目录。
- backend_dir：backend目录。
- pyproject_path：backend的pyproject.toml路径。
- config_path：配置文件路径。默认选根目录的config.yaml。回退到backend的config.yaml。

（二）方法

- install：安装扩展并启用它的打包入口点。需要yes=True确认。
- upgrade：替换已装的扩展。保留私有配置和启用状态。
- set_enabled：启用或停用一个配置好的扩展。
- remove：卸载托管分发并删除激活记录。
- list_configured：按加载顺序返回配置好的扩展。
- _enable_plugin：插入或采纳一个托管plugins记录。检测冲突。
- _read_plugins：读取配置文件里的plugins块。拒绝重复的顶层plugins键。

## 三、它和谁协作

（一）命令行入口

extensions/cli.py把命令分发给ExtensionManager。root的make extension-*目标是包装器。

（二）uv工具

ExtensionManager调用uv add、uv remove、uv sync。调用前丢弃可能改变行为的UV环境变量。

（三）跨进程锁

所有安装/升级/卸载/启停操作持有.cross-process锁.deer-flow/extension-manager.lock。锁保证多进程下的安装互斥。

（四）安全校验

ExtensionManager拒绝含嵌入凭据的源URL。远程引用限HTTPS。拒绝SSH Git URL。

## 四、重要性评级

评级：9分。

理由：ExtensionManager是扩展系统的安装中枢。它管理一个复杂的多文件事务。事务包括依赖文件、锁文件、配置、快照、环境。回滚逻辑处理了并发编辑、中断、恢复同步失败等真实情况。安全校验覆盖凭据泄露、链接逃逸、不可复现的锁引用。扩展系统没有它就没有安装能力。给9分。
