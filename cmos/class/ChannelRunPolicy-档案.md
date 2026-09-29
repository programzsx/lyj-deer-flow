# ChannelRunPolicy档案

## 一、这个类是干什么的

ChannelRunPolicy是每个渠道的运行策略描述。

它是一个冻结的数据类。

它本身不做任何事。

它只是一组开关和参数。

ChannelManager在调度消息时按渠道名查这个策略。

查到的策略决定这次运行的具体行为。

它存在的原因是这样的。

Webhook驱动的渠道，比如GitHub，需要一些普通交互式聊天渠道不需要的东西。

更长的递归上限，因为自主长任务需要更多步数。

关闭澄清提问，因为没有人在现场同步回答。

一个凭证提供器，给智能体铸造平台令牌。

豁免逐发送者的绑定身份门，因为webhook的真实性由HMAC在路由层保证。

把这四件事声明在一个数据类上。

渠道的运行行为就有了一个可发现的单一位置。

新增一个webhook渠道变成一行注册。

不用改管理器的多个方法。

## 二、类的成员

### （一）字段

1、is_interactive

是否交互式。

为False时，管理器设置运行上下文里的disable_clarification，让澄清中间件返回"按最佳判断继续"的工具消息，而不是中断等待。默认True，这是IM渠道的安全默认值。

2、interaction_mode

显式的交互模式。

取值是interactive、webhook、scheduled、autonomous。None表示未声明，保留is_interactive的旧行为。

3、default_recursion_limit

默认递归上限。

设置后，管理器把运行配置的recursion_limit提高到max(现值, limit)。None保持全局默认的100。

4、credentials_provider

凭证提供器。

可选的异步钩子，修改运行上下文注入平台凭证。在运行参数解析之后调用。异常被捕获并记录，凭证失败优雅降级，智能体只读运行，不丢弃投递。

5、requires_bound_identity

是否要求绑定身份。

为False时，管理器跳过逐发送者的绑定身份门。默认True。

6、fire_and_forget

是否发射后不管。

为True时，管理器用runs.create调度运行，运行进入pending就返回。不用runs.wait，后者会为整个运行生命周期保持一条HTTP流。自己做出站的渠道需要这个开关，比如GitHub。它消除SDK在长运行上的300秒读超时。默认False。

7、serialize_thread_runs

是否串行化同线程运行。

为True时，管理器在管理器内部串行化同一线程的入站消息。适合飞书话题这类场景。快速跟发的消息排队等待，而不是撞上运行时的忙碌错误。默认False。

8、buffer_followups_on_busy

是否缓冲忙碌线程的追问。

为True时，fire-and-forget路径上的ConflictError不只是记日志加回复忙碌消息。触发消息会进入按线程分组的追问缓冲。后台监听器订阅活跃运行的流，等运行结束就把缓冲合并成一次追问运行。默认False。

### （二）方法

1、__post_init__()

构造后校验。

interaction_mode声明的值必须在合法集合里，否则抛ValueError。

### （三）模块级注册表

1、CHANNEL_RUN_POLICY

渠道名到策略的全局字典。

不在字典里的渠道落到策略默认值，也就是一个没有凭证管道的交互式IM渠道。Webhook渠道在包导入时注册自己的条目。

## 三、它和谁协作

ChannelRunPolicy是渠道体系的策略声明层。

它被ChannelManager消费。管理器在_resolve_run_params和_apply_channel_policy里按渠道名查它。

它被各渠道的策略注册模块填充。app.channels.buzz_run_policy、feishu_run_policy、app.gateway.github.run_policy在导入时注册条目。

它和manager.py拆开成独立模块。这样渠道注册策略条目时不会和管理器形成循环依赖。

它的每个开关对应管理器调度路径上的一个分支。

## 四、重要性评级

评级：7分。

理由如下。

它让渠道运行行为变得声明式。

四个webhook渠道的需求集中在一个可发现的位置。

它把"新增一个webhook渠道"从改管理器多个方法变成一行注册。

它本身只是数据，没有任何行为。重要性来自管理器对它的消费。

它的设计防止了策略逻辑散落在管理器的if分支里。
