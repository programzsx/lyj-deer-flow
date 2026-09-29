# LarkIntegrationStatus档案

源码位置：backend/packages/harness/deerflow/integrations/lark_cli.py

## 一、这个类是干什么的

LarkIntegrationStatus是Lark/飞书集成的完整状态快照。

设置页需要展示Lark集成的全部信息。装没装。版本是多少。应用配没配。技能装了几个。授权状态如何。这些问题的一次完整回答就是一个LarkIntegrationStatus。

LarkIntegrationStatus是不可变的。类声明用了frozen=True。

## 二、类的成员

（一）字段

- installed：技能包是否已安装。判定条件是manifest存在且lark-shared技能已解压。
- version：当前生效版本。没有manifest时回退到FALLBACK_LARK_CLI_VERSION。
- manifest_version：manifest里记录的版本。没有manifest时为None。
- latest_available_version：GitHub上最新发布版本。check_latest关闭时为None。
- runtime_version_mismatch：技能包版本和运行时CLI二进制版本是否漂移。两边版本未知时保持False。
- app_configured：Lark应用是否已配置。
- app_id：已配置应用的appId。
- app_brand：应用品牌。feishu或lark。
- skills_expected：预期技能数量。
- skills_installed：实际安装技能数量。
- installed_skills：已安装技能名字的元组。
- enabled_skills：已启用技能名字的元组。
- install_path：安装根目录路径。
- cli：LarkCliProbe。CLI二进制的探测结果。
- auth：LarkAuthProbe。用户授权状态的探测结果。
- sandbox_runtime_mode：沙箱运行时模式。取值none、gateway-download、init-container、broker。
- sandbox_runtime_ready：沙箱运行时是否就绪。
- sandbox_runtime_detail：未就绪时的说明。

（二）方法

LarkIntegrationStatus是dataclass。LarkIntegrationStatus没有自定义方法。

## 三、它和谁协作

（一）产生者

get_lark_integration_status是唯一产生者。get_lark_integration_status聚合了多个信息源。manifest文件。config.json。CLI探测。授权探测。版本对齐检查。沙箱运行时检查。三个可选开关控制探测深度。verify_auth控制是否实时验证授权。check_latest控制是否查询GitHub最新版。check_runtime控制是否探测provisioner能力。

（二）消费者

complete_lark_config、set_lark_app_credentials、complete_lark_auth是消费者。这些函数在变更完成后把状态返回给调用方。

LarkInstallResult、LarkConfigCompleteResult、LarkAuthCompleteResult内嵌这个类。这些结果类的status字段就是这个类。

Gateway的路由层是最终消费者。状态接口把这个类序列化后返回给前端设置页。

## 四、重要性评级

评级：5分。

理由：LarkIntegrationStatus是Lark集成对外的统一状态视图。设置页的展示、运维的判断、流程完成后的反馈都依赖这个类。它是聚合器。但聚合的所有信息都来自其他函数。给5分。
