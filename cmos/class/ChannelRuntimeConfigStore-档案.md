# ChannelRuntimeConfigStore档案

## 一、这个类是干什么的

ChannelRuntimeConfigStore是运行时渠道配置的本地持久化存储。

它保存的是用户从浏览器UI输入的渠道凭证。

比如用户在设置页面填了Telegram的bot_token。

这个token不会写回config.yaml。

它存在这个JSON文件里。

这样本地和私有部署就有了持久的运行时配置。

不需要公网回调URL。

不需要手工编辑config.yaml。

它还有一层职责。

它负责把持久化的运行时配置合并进channels配置。还有应用Telegram的bot_username等存在channels之外的连接元数据。

## 二、类的成员

### （一）字段

1、_path

JSON文件路径。

默认在数据目录的channels/runtime-config.json。

2、_data

内存里的配置字典。

3、_lock

线程锁。

所有读写持锁。

### （二）持久化方法

1、_load()

从磁盘加载。

文件损坏时记警告并从空开始。只接受字典结构。

2、_save()

原子写盘。

临时文件和目标文件都chmod为0600。凭证是敏感数据，不能短暂暴露在默认权限下。写入失败清理临时文件并抛出。

### （三）公共API

1、load_all()

返回所有渠道配置的拷贝。

2、get_provider_config()

返回单个渠道的配置拷贝。

3、set_provider_config()

保存单个渠道的配置。

4、set_provider_disconnected()

标记渠道断开连接。

写入enabled为False加运行时禁用标志。

5、remove_provider_config()

删除单个渠道的配置。

### （四）模块级函数

1、merge_runtime_channel_configs()

把持久化的运行时配置合并进channels配置。

只合并channel_connections里启用的渠道。运行时标记为断开的渠道会从配置里移除。

2、apply_runtime_connection_config()

应用存在channels之外的连接元数据。

Telegram用bot username做深链接。UI输入的值存在这里，本地重启后渠道保持配置。

## 三、它和谁协作

ChannelRuntimeConfigStore是渠道体系的运行时配置层。

它被merge_runtime_channel_configs函数使用。这个函数被ChannelService.from_app_config和_load_channel_config调用。

它保存浏览器UI提交的渠道凭证。

它和ChannelStore是平级关系。ChannelStore存会话映射。它存渠道凭证。

它和config.yaml是叠加关系。运行时配置合并进配置文件的channels块。

它的默认路径和ChannelStore在同一个channels目录下。

## 四、重要性评级

评级：6分。

理由如下。

它让浏览器UI配置的渠道凭证能跨重启保留。

它让本地部署不需要公网回调URL就能完成渠道绑定。

它的0600权限写盘保护了敏感凭证。

它只有6分，是因为它只在channel_connections启用的部署里生效。默认部署用不到它。它的逻辑也简单，就是存取和合并。
