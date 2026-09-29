# deerflow.config.acp_config-档案

## 一、这个模块是干什么的

这个模块管理ACP代理的配置。

ACP是Agent Client Protocol。

这个协议让DeerFlow调用外部代理进程。

比如调用Claude Code、Gemini CLI这样的代理工具。

每个ACP代理是一个子进程。

这个配置定义怎么启动子进程、怎么和它交互。

配置写在`config.yaml`的`acp_agents:`下。

## 二、模块里的主要成员

### 1、ACPAgentConfig类

这个类是一个ACP代理的配置。

`command`是启动子进程的命令。

`args`是命令参数。

`env`是注入子进程的环境变量。

以`$`开头的值从宿主环境变量解析。

`description`是代理能力的描述，会出现在工具描述里。

`model`是传给代理的模型提示。

`auto_approve_permissions`决定是否自动批准ACP权限请求。

默认False，也就是全部拒绝。

拒绝时要求代理自己配置成不请求权限。

`timeout_seconds`是单次调用的最大等待，默认1800秒。

没有这个兜底，初始化后挂起的子进程会无限阻塞整个代理回合。

### 2、加载函数

`get_acp_agents()`返回当前配置的代理字典。

没配置时返回空字典。

`load_acp_config_from_dict()`从字典加载。

加载后打一条包含代理名列表的日志。

## 三、它和谁协作

`app_config.py`在加载时调用这里的加载函数。

ACP工具运行时消费代理配置。

`paths.py`为ACP会话提供独立的工作区目录。

## 四、重要性评级

评级：6分。

理由：ACP是接入外部代理工具的协议通道。超时兜底解决真实的挂起阻塞问题。权限自动批准的默认拒绝是安全正确的设计。
