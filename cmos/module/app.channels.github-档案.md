# app.channels.github-档案

## 一、这个模块是干什么的

这个文件定义GitHubChannel。

GitHubChannel是webhook驱动的GitHub渠道。

渠道服务于PR和issue的评论。

其他IM渠道用长轮询或WebSocket。

GitHub不同。

GitHub用HTTP push webhook投递消息。

所以这个渠道的start和stop是空操作。

入站消息通过POST /api/webhooks/github进来。

webhook路由处理器把消息发布到总线。

这个渠道不自动发布agent的最终回复。

每个GitHub agent的沙箱里有gh CLI。

agent自己决定要不要在issue或PR上发帖。

agent在运行中用gh issue comment、gh pr comment、gh pr create。

agent的最终回复只记入日志。

最终回复不发送到GitHub。

## 二、模块里的主要成员

### 1、GitHubChannel类

GitHubChannel继承自Channel。

GitHubChannel是webhook驱动的GitHub渠道实现。

配置在config.yaml的channels.github下。

配置键enabled是开关，设为true激活。

配置键default_mention_login是可选的bot句柄。

require_mention在agent绑定没设置句柄时用它。

缺省回退到deerflow-bot。

#### （1）__init__方法

__init__调用父类构造。

渠道名固定为github。

#### （2）start方法

start注册出站回调。

GitHub是push型webhook。

不需要长轮询或socket监听。

只注册出站回复订阅。

agent的最终消息能被记录。

已在运行就直接返回。

#### （3）stop方法

stop注销出站回调。

不在运行就直接返回。

#### （4）send方法

send记录agent的最终消息。

send不发布到GitHub。

GitHub agent自己用gh发帖到issue或PR。

最终回复记入gateway.log便于观察。

最终回复不投递到平台。

send读消息的metadata做日志上下文。

metadata里的repo是owner/name形式。

repo缺失就回退到chat_id。

metadata里的number是issue或PR编号。

send在INFO级别记录日志。

send在DEBUG级别镜像消息体本身。

消息体截断到2000字符。

截断让日志行有界。

#### （5）为什么只写日志而不自动发帖

原因有三个。

第一个原因是两个agent可以绑定同一个事件。

比如coder和reviewer都在同一个mention上。

如果两者都自动发帖，用户每次mention会看到两条回复。

哪怕只有一方有有用工作。

让LLM在运行中调gh，沉默只表示LLM没调gh。

第二个原因是agent经常要发中间更新。

中间更新比如issue评论链接PR、在新子issue上评论。

自动发最终消息的契约建模不了这种需求。

最终消息被迫承担双重职责。

第三个原因是调度器的_is_self_event门槛已经防止了回环。

LLM用gh发的评论不会被webhook再带回同一agent的新运行。

## 三、它和谁协作

它继承app.channels.base里的Channel。

它依赖app.channels.message_bus里的MessageBus和OutboundMessage。

它的入站消息来自app.gateway.github的webhook路由。

webhook路由验证HMAC后把事件扇出到总线。

它的运行策略由run_policy定义，fire_and_forget为True。

agent在沙箱里通过gh CLI回帖GitHub。

它被service.py管理生命周期。

## 四、重要性评级

评级是6分。

理由是它是GitHub事件驱动agent的渠道入口。

入站靠webhook路由，出站策略"只写日志"是刻意设计。

出站策略解决了多agent重复回复和中间更新两个问题。

没有这个渠道，GitHub上的issue和PR评论无法驱动agent。

不评高分的原因是它本身很薄，start、stop、send加起来只有日志逻辑。

重活都在webhook路由和manager里。
