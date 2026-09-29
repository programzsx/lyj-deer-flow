# ChannelService档案

## 一、这个类是干什么的

ChannelService负责所有IM渠道的生命周期管理。

它的工作内容是这样的。

它从config.yaml的channels键读取配置。

它创建MessageBus、ChannelStore和ChannelManager。

它实例化配置里启用的渠道。

它启动渠道，保证渠道进入运行状态。

它按需重启单个渠道。

它处理浏览器UI提交的运行时配置变更。

它在关闭时按正确的顺序停止一切。

它的关闭顺序是这样的。

先停ChannelManager。管理器关闭准入，工作协程消化已接收的消息。渠道的传输层保持存活，让已发出的"处理中"提示还能收到最终更新。管理器停完之后，再逐个停渠道。

## 二、类的成员

### （一）字段

1、bus

MessageBus实例。

它传给管理器和所有渠道。

2、store

ChannelStore实例。

它负责会话到线程的映射。

3、manager

ChannelManager实例。

它负责消息调度。

4、_channels

渠道实例的字典。

键是渠道名。

5、_config

当前生效的配置。

包含UI提交的运行时覆盖。

6、_running

服务运行状态。

7、_readiness_locks

按渠道分组的就绪锁。

它保证并发的就绪检查不会把同一个渠道停启两次。

### （二）构造与工厂方法

1、__init__()

构造服务。

它解析队列容量、并发数、宽限期、服务地址等配置。它创建总线、存储和管理器。它根据应用配置创建去重存储。

2、from_app_config()

从应用配置创建服务。

它读取config.yaml的channels块。它合并channel_connections的运行时配置。它根据连接配置决定是否要求绑定身份。

### （三）生命周期方法

1、start()

启动管理器和所有启用的渠道。

它先启动管理器。然后做两轮就绪检查，统计就绪渠道数。

2、stop()

停止一切。

它先停管理器。然后逐个停渠道。停成功才丢弃渠道实例。任何一个渠道停失败，会汇总成异常组抛出。

3、ensure_ready_channels()

启动或重启所有未就绪的已启用渠道。

4、ensure_channel_ready()

保证单个渠道在运行。

按渠道加锁串行化。已在运行直接返回。旧实例按所有权规则清理后重新启动。支持多次重试。

5、restart_channel()

重启单个渠道。

可以选在重启前重新从磁盘加载配置。

6、configure_channel()

应用运行时配置并按需重启。

UI刚提交的配置是权威的，这里故意不重新读文件，避免旧磁盘配置覆盖它。

7、remove_channel()

移除运行时配置并停掉正在运行的渠道。

8、_start_channel()

实例化并启动单个渠道。

按注册表的导入路径懒加载渠道类。给配置注入channel_store、seen_event_store_path、connection_repo。拒绝在保留的旧实例之上再装新实例。启动后检查渠道真的进入运行状态。

9、_stop_and_discard_channel()

停渠道，停完才丢弃。

这是所有丢弃路径共用的所有权保护清理。start()在传输层确认前就订阅了出站回调，所以一个没停干净的实例必须先stop再丢弃。否则总线会保留死回调的强引用，未来的出站消息都会扇出到它。

10、_load_channel_config()

从磁盘重新加载单个渠道的最新配置。

会重新应用UI的运行时覆盖。

### （四）查询方法

1、get_status()

返回所有渠道的状态。

2、get_channel()

按名字返回运行中的渠道实例。

3、is_channel_enabled()

返回渠道是否启用。

跟踪运行时权威的配置字典。

4、get_channel_config()

返回渠道配置的浅拷贝。

返回None表示未配置，和配置了默认值区分开。

## 三、它和谁协作

ChannelService是渠道体系的最外层管理者。

它创建MessageBus。总线是消息中枢。

它创建ChannelStore。存储负责会话映射。

它创建并持有ChannelManager。管理器是调度核心。

它实例化并管理全部九个Channel子类。

它通过_CHANNEL_REGISTRY注册表懒加载渠道类。

它被Gateway应用层的启动函数调用。start_channel_service是全局单例入口。

它被渠道连接的HTTP路由调用，处理浏览器发起的配置和重启。

它把StreamBridge访问器透传给ChannelManager，支持追问缓冲的自动排空。

## 四、重要性评级

评级：8分。

理由如下。

它负责所有渠道的启动、重启、停止、配置变更。

它的所有权保护清理规则解决的是死回调残留的真实问题。

它的关闭顺序决定了停机时消息能否正常送达。

它让渠道配置可以运行时变更，不需要重启进程。

它比调度器和总线低一分，是因为它不参与消息流转本身。它只管对象的生老病死。
