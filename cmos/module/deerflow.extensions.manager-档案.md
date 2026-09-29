# deerflow.extensions.manager档案

## 一、这个模块是干什么的

这个模块负责已打包插件的安装管理。

操作员通过命令行安装插件。安装一个插件意味着很多事情。要把插件包加进backend的依赖。要更新uv.lock。要发现插件的入口点。要往config.yaml的`plugins:`列表里写一条记录。这个模块把这一整套事情管理成一个事务。

这个模块的核心承诺是原子性。安装或卸载中途失败。依赖文件、配置文件、源码快照、环境全部恢复原样。不会留下半安装的状态。

## 二、模块里的主要成员

### 1、ExtensionManager类

这是管理器本体。主要方法有下面这些。

- `install(source, yes, required)`，安装一个扩展源。source可以是本地目录、Python包需求或Git URL。`yes`必须显式传true。不传直接拒绝。因为安装会执行第三方代码。`required`决定插件加载失败时是否中止启动。
- `upgrade(source)`，替换已安装的扩展源。保留私有配置和启用状态。
- `set_enabled(identifier, enabled)`，启用或禁用一个配置的扩展。不丢配置。
- `remove(identifier)`，卸载一个受管理的发行包。删除配置条目。删除源码快照。
- `list_configured()`，按配置列表顺序返回配置的扩展。

### 2、install的事务流程

安装流程如下。

- 先验证source。本地目录要做快照校验。拒绝符号链接、junction、敏感文件。远端源要过URL校验。只接受HTTPS。拒绝SSH、file URL、嵌入凭证的URL。
- 本地目录变成快照。复制到`backend/extensions/sources/<发行名>/`。忽略Git元数据、虚拟环境、Python缓存。拒绝敏感文件比如`.env`、`.pem`、`.npmrc`。
- 读config并校验。config必须合法。因为uv命令会执行包的构建后端。一个永远写不进去的config必须在那个代码跑之前失败。
- 检查uv版本。要求0.8.0以上。
- 给依赖文件拍快照。运行`uv add --group extensions --no-workspace --no-sync`。
- 校验uv.lock里的本地源。锁里不能有Docker构建上下文之外的本地引用。
- 同步环境。运行`uv sync --locked --all-packages`。
- 发现入口点。用backend的Python解释器跑一段脚本。从importlib.metadata读入口点。
- 写plugins记录。这是唯一的配置变更。放在最后原子执行。
- 全程持有跨进程的`.deer-flow/extension-manager.lock`锁。

失败路径做完整恢复。恢复依赖文件快照。删除源码快照。再跑一次恢复同步。恢复同步本身失败也要把快照再恢复一次。并发的外部编辑被检测到时保留那个编辑并报错。

### 3、_validate_remote_source函数

校验远端源。规则如下。

- 拒绝URL里带凭证样式的查询参数。有很长的正则匹配api key、token、password之类的键名。
- 拒绝Git的SCP简写。`git@host:org/repo.git`这种。
- 拒绝file URL和SSH。
- HTTP只接受localhost。
- 必须是HTTPS。
- 拒绝嵌入凭证的用户名密码。

### 4、_validate_locked_local_sources函数

审计uv.lock。Docker镜像构建会复制backend目录。锁里的本地引用必须能被构建复现。绝对路径、file URL、工作区之外的相对路径都拒绝。loopback URL只警告不回滚。

### 5、_write_plugins_block和_plugins_block_span函数

把`plugins:`块原地重写进config.yaml。

块的两条边界都来自YAML解析器。不用键形状的正则。因为AppConfig允许额外的顶层键。下一个段可能叫任何名字。正则认不出来就会把邻居整个替换掉。

### 6、_manager_lock函数

跨进程的文件锁。Windows用msvcrt字节范围锁加非阻塞重试。POSIX用fcntl。锁保证一个检出的所有扩展变更串行。

## 三、它和谁协作

这个模块被`deerflow.extensions.cli`调用。命令行的全部操作委托给manager。

这个模块依赖yaml和tomllib读写config和pyproject。依赖subprocess调用uv和backend的Python解释器。

这个模块和`deerflow.extensions.loader.ExtensionSpec`协作。list_configured用它校验配置。

这个模块和alembic的`_env_filters`协作。table_prefix的声明由loader注册。loader的配置就是manager写入的。

## 四、重要性评级

评级是8分。

理由。这个模块是插件发行链路的执行者。配置只是声明。真正把插件装进系统的是它。

事务设计是这个模块最关键的部分。安装会运行uv。uv会执行包的构建后端。失败恢复的顺序很讲究。config变更放在最后原子执行。依赖文件快照在uv之前拍。恢复同步失败也要再恢复一次。这些设计保证不会留下半安装状态。

安全设计也很关键。源码快照拒绝符号链接和敏感文件。远端源只接受HTTPS。URL里拒绝凭证。锁审计防止不可复现的源进入构建。这些规则挡住了常见的打包事故。

扣两分的原因。它只在安装管理时运行。Gateway运行时不依赖它。它不参与加载、注入、隔离这些运行时功能。
