# app.channels.runtime_config_store-档案

## 一、这个模块是干什么的

这个文件定义ChannelRuntimeConfigStore。

ChannelRuntimeConfigStore持久化运行时的渠道配置。

运行时配置指用户从UI输入的渠道凭证。

本地或私有部署用这个存储获得持久的运行时配置。

不需要公网回调URL。

也不需要改config.yaml。

这个文件还提供合并工具。

合并工具把持久化的配置合并进channels_config。

## 二、模块里的主要成员

### 1、RUNTIME_CHANNEL_DISABLED_FLAG常量

RUNTIME_CHANNEL_DISABLED_FLAG的值是"_runtime_disabled"。

这个标记记录渠道在运行时被断开。

### 2、ChannelRuntimeConfigStore类

ChannelRuntimeConfigStore是JSON文件存储。

存储刻意模仿ChannelStore。

存储的键是渠道名，比如telegram、slack。

值是渠道配置字典。

#### （1）__init__方法

__init__接受可选的path参数。

不传path就用默认路径。

默认路径是paths.base_dir下的channels/runtime-config.json。

__init__创建父目录。

__init__加载数据。

__init__创建threading.Lock。

#### （2）_load方法

_load读取JSON文件。

文件不存在返回空字典。

解析失败记录警告并返回空字典。

损坏的存储被丢弃。

解析成功后只保留值为字典的条目。

键转成字符串。

#### （3）_save方法

_save先给临时文件设置0o600权限。

0o600表示只有属主能读写。

渠道凭证是敏感信息，权限收紧是刻意的。

写完用replace原子替换目标文件。

替换后再给目标文件设置0o600权限。

chmod失败记录debug日志。

chmod失败不中断保存。

写失败时删除临时文件并抛出异常。

#### （4）load_all方法

load_all返回全部渠道配置的副本。

返回副本是为了防止调用方直接改内部数据。

#### （5）get_provider_config方法

get_provider_config查询单个渠道的配置。

查不到或不是字典返回None。

返回的是副本。

#### （6）set_provider_config方法

set_provider_config保存一个渠道的配置。

保存时复制一份。

写完调用_save持久化。

#### （7）set_provider_disconnected方法

set_provider_disconnected标记渠道已断开。

写入enabled为False。

还写入_runtime_disabled标记为True。

写完持久化。

#### （8）remove_provider_config方法

remove_provider_config删除一个渠道的配置。

不存在返回False。

删除成功返回True。

### 3、模块级合并函数

#### （1）_provider_enabled函数

_provider_enabled检查渠道在channel_connections配置里是否启用。

读渠道配置的enabled属性。

#### （2）_runtime_channel_disconnected函数

_runtime_channel_disconnected判断运行时配置是不是已断开。

判断条件是_runtime_disabled为True且enabled为False。

两个条件都满足才算断开。

#### （3）merge_runtime_channel_configs函数

merge_runtime_channel_configs把持久化的运行时配置合并进channels_config。

合并在原地完成。

channel_connections配置为None或未启用就不合并。

函数遍历存储里的全部运行时配置。

provider在channel_connections里未启用就跳过。

provider运行时已断开就从channels_config里移除。

其他情况把运行时配置合并进已有配置。

没有已有配置就从空字典开始合并。

#### （4）apply_runtime_connection_config函数

apply_runtime_connection_config应用channels之外的持久化连接元数据。

Telegram用bot用户名生成深链。

UI输入的bot_username存在运行时渠道配置里。

本地重启后provider保持配置。

函数读telegram的运行时配置。

bot_username为空或telegram未启用就原样返回配置。

否则深拷贝配置。

把bot_username写进config.telegram。

## 三、它和谁协作

它被service.py调用，启动渠道时合并运行时配置。

它被渠道连接相关代码调用，保存和读取UI输入的凭证。

它依赖deerflow.config.paths里的get_paths确定默认路径。

它模仿ChannelStore的结构。

## 四、重要性评级

评级是6分。

理由是用户从UI输入的渠道凭证靠它持久化。

没有它，重启后UI配置的渠道会丢失。

本地部署不需要改config.yaml就能配渠道。

0o600权限和原子写入保护了敏感凭证。

不评高分的原因是它只是键值存储加合并工具，不承载调度逻辑。
