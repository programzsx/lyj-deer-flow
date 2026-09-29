# deerflow.integrations.lark_cli

## 一、这个模块是干什么的

这个模块是Lark和飞书CLI集成的管理支持。

背景是这样的。

Lark和飞书是常用的IM平台。

官方提供了lark系列技能和lark-cli工具。

系统把这些打包成一个受管集成。

用户安装集成后就能在沙箱里用Lark工具。

这个模块管整个集成的生命周期。

它管安装。

管版本管理。

管凭据。

管应用注册。

管授权状态。

版本管理有个规则。

安装的技能包版本跟随Gateway运行时的lark-cli二进制版本。

这保证技能和实际执行它们的CLI对齐。

二进制不可用时用回退版本。

完整性校验也有讲究。

GitHub不保证源压缩包字节跨版本稳定。

所以不按版本钉字节哈希。

改用两个手段。

手段一是下载源固定到官方GitHub主机，版本只来自运行时CLI或回退常量。

手段二是对解压后的技能树算内容SHA-256，记进manifest。

内容变了就能检测到。

凭据管理是重点。

应用注册和应用切换用事务替换凭据树。

切换前先清掉旧OAuth数据。

因为Linux上lark-cli的config init会把新密钥写进文件式keychain。

切换失败会把完整旧树恢复回来。

Windows上还有一堆原生代码。

用ctypes调Windows API。

做目录权限加固。

拒绝符号链接。

防跟踪。

## 二、模块里的主要成员

- install_lark_integration：安装集成。下载技能包、验证、落位、记录manifest。
- get_lark_integration_status：查询集成状态。暴露最新可用版本和版本漂移标记。
- lark_skills_installed：判断技能包是否已安装。
- ensure_lark_cli_credential_tree：确保凭据目录树存在并加固。
- start_lark_config、complete_lark_config：应用注册流程。带验证URL和轮询。
- set_lark_app_credentials：保存应用凭据。事务替换。
- start_lark_auth、complete_lark_auth：用户授权流程。
- sandbox_lark_broker_active：查询代理模式是否激活。
- lark_cli_env_overlay、lark_cli_env：构造沙箱的环境变量覆盖。
- probe_lark_cli、probe_lark_auth：探测CLI和授权状态。
- Windows加固相关的函数群。拒绝reparse点、按句柄设置安全描述符、原生目录枚举。
- LarkIntegrationStatus、LarkInstallResult等数据类：各流程的结果结构。

## 三、它和谁协作

- 它被community/aio_sandbox/aio_sandbox_provider.py引用。沙箱编排按用户准备Lark凭据挂载。
- 它被sandbox/tools.py引用。工具侧查询集成状态和环境覆盖。
- 它和integrations/lark_broker协作。代理模式由它决定是否激活。
- 它和外部GitHub、Lark开放平台通信。

## 四、重要性评级

评级是6分。

理由是它是Lark集成的完整生命周期管理。

凭据的事务替换和加固是安全核心。

版本对齐机制保证技能和CLI一致。

Windows原生加固代码复杂且难写对。

但它是单一集成的专用模块，不在系统的热路径上。
