# deerflow.integrations-档案

## 一、这个包是干什么的

这个包是DeerFlow的"第一方集成"包。

包名是`deerflow.integrations`。源码在`backend/packages/harness/deerflow/integrations/`。

大白话讲。DeerFlow要和一些外部服务做深度集成。目前这个包里只有Lark（飞书）集成。这个包管Lark集成的三块事情。

- 把Lark的技能包装进DeerFlow。下载官方归档，解压技能，写清单。
- 管理Lark CLI的二进制和每用户的凭证。
- 提供一个凭证代理服务。让沙箱里的agent能用Lark CLI，但永远看不到原始凭证文件。

它的定位写在模块docstring里。第一方集成安装器和状态助手。这是官方维护的集成，和社区工具不同。

## 二、包里的主要成员

### 1、__init__.py

只有一行docstring。`"""First-party integration installers and status helpers."""`。没有任何导出。调用方都是直接导入子模块。

### 2、lark_cli.py（Lark CLI集成主体）

这是包里最大的文件。约11.7万字节，2800多行。它管Lark CLI的完整生命周期。

按职责分组。

- 状态数据类。`LarkCliProbe`、`LarkAuthProbe`、`LarkIntegrationStatus`、`LarkInstallResult`、`LarkConfigStartResult`、`LarkConfigCompleteResult`、`LarkAuthStartResult`、`LarkAuthCompleteResult`。全是frozen dataclass。
- 集成安装。`install_lark_integration()`下载Lark技能归档，解压进用户集成目录，写manifest。支持显式归档、环境变量归档、自动解析最新版本三种来源。
- CLI二进制管理。`_ensure_managed_gateway_lark_cli()`、`_ensure_managed_sandbox_lark_cli()`。下载官方release资产，校验checksum，解压运行时二进制，写沙箱launcher。带互斥安装锁。
- 凭证树管理。`ensure_lark_cli_credential_tree()`为每用户建`config`和`data`目录并加固权限。Windows和POSIX各有专门的加固路径。
- Windows安全加固。这是文件里最重的一块。`_windows_private_sddl()`、`_nt_open_relative()`、`_WindowsTreeHandle`等。用ctypes直接调Windows NT API。拒绝reparse point。建立私有目录边界。防止凭证文件被符号链接攻击或被其他用户读到。这一块占了文件近一半的行数。
- OAuth配置流。`start_lark_config()`、`complete_lark_config()`、`set_lark_app_credentials()`。设备码流。用户去飞书页面输入user_code。后台轮询注册结果。带flow generation防过期流完成。
- 授权流。`start_lark_auth()`、`complete_lark_auth()`。同样是设备码流。
- 状态查询。`get_lark_integration_status()`汇总安装、版本漂移、CLI可用性、授权状态、沙箱运行时就绪度。
- `lark_cli_env_overlay()`、`lark_cli_env()`。给沙箱和网关的Lark CLI环境变量。
- `sandbox_lark_broker_active()`。判断broker模式是否激活。
- `read_lark_app_config()`。读当前app配置。不返回appSecret本身，只返回configured布尔、app_id、brand。
- 技能引导。`_append_deerflow_lark_shared_guidance()`往安装好的技能里追加DeerFlow专属引导文本。版本标记变化时会提示重装刷新。

一个重要的凭证事务设计。app注册和直接app切换会整体替换每用户的Lark凭证树。先清掉旧OAuth数据再跑`lark-cli config init`。在Linux上这个命令把新app secret写进数据目录下的文件型keychain。如果之后才清目录，会留下悬空的keychain引用。事务快照提供旧OAuth数据供登出。任何切换步骤失败就恢复完整的旧树。

### 3、lark_broker.py（Lark CLI凭证代理）

这个模块实现凭证代理（Pattern B，issue #4338）。

背景。Pattern A把`lark-cli`二进制装进沙箱，但把每用户凭证目录挂进沙箱容器。agent的bash工具能读到原始凭证文件。这不好。

Pattern B的做法。一个长驻进程持有`lark-cli`加凭证。只在环回地址上暴露命令面。沙箱里放一个极小的`lark-cli`垫片。垫片把argv和stdin转发给代理。原始凭证文件永远不出现在沙箱文件系统里。

- `BrokerConfig`。代理配置。`lark_cli_path`、`config_dir`、`data_dir`、端口、超时、拒绝的子命令列表。`credential_env()`生成注入每次调用的环境变量。凭证路径由代理持有，沙箱进程指不了别的profile。
- `run_lark_cli()`。跑单次lark-cli调用。argv列表加`shell=False`，沙箱给的参数不可能被shell解释成第二条命令。配置的拒绝子命令前缀在生成进程前就拒绝。
- `make_handler()`。构建HTTP请求处理器。有界信号量限制并发，最多8个。防沙箱洪水生成无限子进程。每个连接有30秒socket超时。防大Content-Length挂着线程。
- `serve()`。启动环回HTTP服务器。默认`127.0.0.1:8788`。
- `install_shim()`。往沙箱运行时目录写launcher加shim加版本标记。launcher是`/bin/sh`脚本。它自己解析Python 3解释器。找不到就大声报错。不是无声的ENOEXEC。shim是Python脚本，把argv和stdin POST给代理，回放stdout、stderr、退出码。传输失败就大声失败退出非零。代理宕机永远不像一次成功的lark-cli运行。
- 限额。请求最多1MiB。输出最多4MiB。默认超时120秒。
- 拒绝子命令列表。环境变量`DEERFLOW_LARK_BROKER_DENY_SUBCOMMANDS`配置。匹配前导非flag令牌。`config --json show`也会被`config show`规则抓住。这缩小了提示注入的agent能到达的命令面。
- 整个模块只用Python 3标准库。这样同一个模块能跑进最小的代理sidecar镜像，不装额外依赖。

## 三、它和谁协作

### 1、上游（谁调用它）

实际查证全仓库有8个文件导入`deerflow.integrations`。生产代码里的调用方如下。

- `app.gateway.capabilities`。能力接口。调`get_lark_integration_status`。
- `app.gateway.routers.integrations`。集成的HTTP路由。安装、配置、授权、状态。
- `deerflow.community.aio_sandbox.aio_sandbox_provider`。沙箱提供者。用凭证树加固、技能安装检查、broker激活判断。
- `deerflow.sandbox.tools`。bash工具。调`lark_cli_env_overlay`和`sandbox_lark_broker_active`。
- `deerflow.client`（内嵌客户端间接经环境变量消费）。

### 2、下游（它依赖谁）

- `deerflow.config`。`AppConfig`、`Paths`。
- Lark官方发布资产。GitHub release下载。
- Python标准库。`http.server`、`subprocess`、`ctypes`、`zipfile`。broker刻意零第三方依赖。
- Lark/飞书服务本身。设备码流的注册和授权端点。

### 3、测试

`tests/test_lark_broker.py`、`tests/test_lark_cli_integration.py`、`tests/blocking_io/test_integrations_router.py`。

## 四、重要性评级

评级是3分。

理由如下。

这个包服务一个单一厂商的集成。Lark（飞书）。不用Lark的部署里它完全不参与运行。

它的代码量不小。约15.7万字节。但其中近一半是Windows凭证加固的ctypes代码。这部分只在Windows本地开发时生效。

它被引用的地方很少。实际查证全仓库只有8个文件导入它。生产代码里只有4个调用方。Gateway的两个模块加沙箱的两个模块。

删除它会怎样。Lark集成整个失效。Gateway的integrations路由会启动失败。用Lark技能包的用户无法安装和授权。不用Lark的部署（绝大多数）什么都不会变。agent核心、模型、MCP、项目功能全部照常。

为什么是3分不是更低分。它是一个完整的、质量很高的集成实现。凭证代理的设计（命令面与凭证分离）和Windows安全加固都很用心。它是"加一个第一方深度集成"的完整样板。

为什么不是更高分。它不在任何核心路径上。单一厂商。小众需求。删除的爆炸半径局限在Lark用户。
