# app.channels.run_policy-档案

## 一、这个模块是干什么的

这个文件是渠道运行策略的注册表。

它存放全局的CHANNEL_RUN_POLICY映射表。

它存放ChannelRunPolicy描述符。

这个文件被拆成独立模块是有原因的。

原因是各渠道要注册自己的策略条目。

注册通常在导入渠道包时以副作用完成。

拆出来避免了渠道对manager模块的循环依赖。

manager的调度路径按msg.channel_name查策略条目。

查询发生在_resolve_run_params之后。

## 二、模块里的主要成员

### 1、InteractionMode类型

InteractionMode是Literal类型。

合法值是interactive、webhook、scheduled、autonomous。

_INVALID_INTERACTION_MODES是全部合法值的frozenset。

### 2、ChannelRunPolicy数据类

ChannelRunPolicy是frozen数据类。

数据类不可修改。

ChannelManager的_apply_channel_policy方法应用这些开关。

webhook驱动渠道（今天的GitHub）需要四样东西。

第一样是更高的recursion_limit，供自主长运行使用。

第二样是抑制ask_clarification，因为没有人类同步在场。

第三样是凭证provider，为agent铸造平台token。

第四样是退出按发送者绑定身份的门槛，真实性由webhook路由的HMAC保证。

#### （1）is_interactive字段

is_interactive为False时manager设置run_context的disable_clarification为True。

ClarificationMiddleware会返回"按最佳判断继续"的ToolMessage。

不再用Command(goto=END)中断。

默认值是True。

True是IM渠道的安全默认。

#### （2）interaction_mode字段

interaction_mode是显式交互模式，转发给主agent。

None表示没有声明模式。

None保留旧的is_interactive行为。

__post_init__校验模式合法性。

未知模式抛出ValueError。

#### （3）default_recursion_limit字段

default_recursion_limit被设置时manager提高recursion_limit。

提高规则是取现有值和limit的较大者。

None保留全局默认100。

交互式聊天轮次用不到250个超级步。

#### （4）credentials_provider字段

credentials_provider是可选的异步钩子。

钩子把平台特有的凭证写进run_context。

钩子在_resolve_run_params之后被调用。

钩子的异常被捕获并记录。

凭证失败优雅降级。

agent只读运行，投递不丢。

#### （5）requires_bound_identity字段

requires_bound_identity为False时manager跳过按发送者的绑定身份门槛。

跳过发生在channel_connections.enabled打开时也生效。

webhook认证的渠道没有按发送者的/connect握手。

真实身份由webhook路由的HMAC保证。

"发送者"到DeerFlow用户的绑定编码在agent的config.yaml所有权里。

绑定不在channel-connections表里。

默认值是True。

#### （6）fire_and_forget字段

fire_and_forget为True时manager用runs.create调度运行。

runs.create在运行进入pending后立即返回。

否则用runs.wait。

runs.wait在整个运行生命周期保持HTTP流打开。

自己在运行中做出站的渠道不需要manager回传最终状态。

GitHub就是例子，agent用沙箱里的gh CLI发帖到issue或PR。

这个开关消除了SDK的300秒httpx.ReadTimeout。

运行超过5分钟时那个超时会误报"internal error"出站。

默认值是False。

#### （7）serialize_thread_runs字段

serialize_thread_runs为True时manager串行化同线程的入站轮次。

串行而不是暴露运行时通用的忙碌线程错误。

飞书话题这样的聊天界面需要它。

快速追问应该排在活跃轮次后面。

无关的DeerFlow线程继续并发。

默认值是False。

已有渠道保持运行时的原生multitask行为，除非显式选择加入。

#### （8）buffer_followups_on_busy字段

buffer_followups_on_busy为True时fire_and_forget路径上的ConflictError做更多事。

更多事指把触发消息追加到按线程的后续缓冲。

后台观察者订阅活跃运行的StreamBridge流。

运行一结束就合并缓冲成一次后续运行。

这个开关针对send只是日志的fire_and_forget渠道。

GitHub的send只写日志。

没有它，忙碌发送者看来是消息被静默丢弃。

默认值是False。

未加入的渠道保持旧的静默丢弃加日志行为。

GitHub的选择加入在app.gateway.github.run_policy。

### 3、CHANNEL_RUN_POLICY映射表

CHANNEL_RUN_POLICY是字典。

键是渠道名。

值是ChannelRunPolicy实例。

不在表里的渠道走默认策略。

默认策略是没有凭证管线的交互式IM渠道。

GitHub之前每个IM渠道都是这个默认。

webhook渠道在包导入时注册自己的条目。

## 三、它和谁协作

它被buzz_run_policy和feishu_run_policy调用，这两个文件注册buzz和feishu的策略。

它被app.gateway.github.run_policy调用，注册GitHub的策略。

它被manager.py调用，manager按渠道名查策略并应用。

它只在类型检查时引用message_bus的InboundMessage，避免运行时循环导入。

## 四、重要性评级

评级是8分。

理由是全部渠道的运行行为开关都定义在这里。

fire_and_forget解决了GitHub长运行的超时问题。

serialize_thread_runs解决了飞书快速追问的忙碌问题。

buffer_followups_on_busy解决了GitHub忙碌消息被静默丢弃的问题。

它还是打破循环依赖的关键拆分。

不评10分的原因是它只是声明式配置，不含执行逻辑，真正的调度在manager里。
