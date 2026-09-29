# GitHubChannel档案

## 一、这个类是干什么的

GitHubChannel是GitHub平台的渠道实现。

它和其他IM渠道很不一样。

其他渠道用长轮询或WebSocket接收消息。

GitHub用HTTP推送webhook。

所以这个类的start和stop几乎是空操作。

入站消息来自POST /api/webhooks/github路由。

webhook路由验证投递后把消息发布到总线。

这个渠道不需要轮询工作者。

它最重要的特点是不自动发回复。

智能体的最终回复只记日志，不发到GitHub。

为什么这样设计。

原因有三个。

多个智能体可以绑定同一个事件。如果都自动发回复，用户会看到多条重复回复。

智能体经常想发中间更新。自动发最终消息的契约没法表达这个。

智能体自己决定发什么，沉默只是"智能体没调用gh"。沉默是廉价的。

## 二、类的成员

### （一）字段

它没有自己的字段。

只继承基类的name、bus、config、_running、_connection_repo。

配置键只有两个。

enabled是操作员的总开关。

default_mention_login是提及要求用的机器人句柄。

### （二）生命周期方法

1、start()

注册出站回调。

GitHub是推送型的，webhook入站不需要轮询或socket监听。只注册出站回调，让智能体的最终消息被记录。

2、stop()

注销出站回调。

### （三）出站方法

1、send()

记录智能体的最终消息，不发到GitHub。

元数据里读仓库和issue或PR编号做日志上下文。正文在INFO级别记录长度。正文本身在DEBUG级别记录，截断到2000字符。

## 三、它和谁协作

GitHubChannel是渠道体系的一个平台实现。

它继承Channel基类。但它只用到了基类的一小部分。它没有socket或轮询。它不用跨线程提交设施。它不用入站预留。

它依赖webhook路由。入站消息由app.gateway里的webhook路由验证并扇出。

它依赖MessageBus。只注册出站回调记录最终消息。

它被ChannelService实例化和管理。

它的入站消息由webhook路由通过fanout_event发布，一个智能体绑定发布一条InboundMessage。

它的运行策略在app.gateway.github.run_policy里注册。fire_and_forget为True。buffer_followups_on_busy为True。

智能体用沙箱里的gh CLI自己回复GitHub。

## 四、重要性评级

评级：5分。

理由如下。

它是GitHub事件驱动智能体的渠道端点。

它没有它，webhook路由扇出的消息没有渠道层的承载。

它的log-only设计是一个深思熟虑的架构决策，防止多个智能体重复回复。

它的实现极简。只有start、stop、send三个方法，几乎没有逻辑。

它的大部分复杂性都在webhook路由和运行策略里，不在这个类里。所以只有5分。
