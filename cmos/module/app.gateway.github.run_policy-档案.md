# app.gateway.github.run_policy 档案

## 一、这个模块是干什么的

这个模块是GitHub频道的每次运行策略钩子。

通用的`ChannelManager`按`msg.channel_name`查找`ChannelRunPolicy`。

manager在解析运行参数之后、智能体运行之前应用策略。

GitHub频道在这里注册自己的策略条目。

GitHub特定的提供者闭包放在这里。

不内联进ChannelManager。

这样每个新的webhook频道都能带自己的run_policy.py。

manager不用改。

## 二、模块里的主要成员

### 1、inject_github_credentials函数

这个函数往`run_context`里安装GitHub App安装令牌。

分发器把每个绑定的`installation_id`带在消息metadata里。

这个函数铸一个短期安装令牌。

令牌以字符串形式放进`run_context["github_token"]`。

为什么是字符串而不是闭包。

run_context要经过`langgraph_sdk`的HTTP客户端传输。

即使运行时嵌在同一进程里，payload也会被JSON编码。

Python函数无法存活这种编码。

字符串形状能通过SDK传输往返。

harness侧已经同时接受字符串和零参可调用。

铸令牌在总线消费侧做。

不在webhook路由里做。

这样GitHub的10秒送达超时安全。

铸令牌失败会向上传播。

manager记录日志并让运行继续。

没有凭据的只读运行好过没有响应。

### 2、register_policy函数

这个函数注册GitHub频道的策略条目。

网关引导时调用一次。

模块导入时也自动调用一次。

测试代码直接构造ChannelManager时也能拿到注册。

注册是幂等的。

注册两次只是覆盖同一行。

### 3、注册的策略内容

策略带六个字段。

`is_interactive=False`。

GitHub webhooks没有同步的人类。

`ask_clarification`会让运行死等。

`interaction_mode="webhook"`。

`default_recursion_limit=250`。

自主编码运行要克隆、编辑、测试、推送、开PR。

这些 routinely 超过100步的交互上限。

每个智能体的`recursion_limit`覆盖仍然优先。

`credentials_provider=inject_github_credentials`。

`requires_bound_identity=False`。

GitHub投递在webhook路由已经HMAC认证。

sender到DeerFlow用户的绑定编码在智能体的config.yaml里。

没有每sender的/connect握手。

`fire_and_forget=True`。

GitHub智能体自己在沙箱里通过`gh`发回PR。

频道的send只做日志。

不需要为几分钟的编码运行开一条HTTP流。

流会在SDK的300秒超时处死掉。

fire-and-forget把调用换成`runs.create`。

`buffer_followups_on_busy=True`。

忙线程的排队消息对评论者不可见。

缓冲加排水修复了这一点。

其他fire-and-forget频道保持默认False。

直到它们有同样的只记录send形状才显式加入。

## 三、它和谁协作

### 1、它依赖谁

它依赖`app.channels.run_policy`的策略注册表。

它延迟导入`app.gateway.github.app_auth`。

导入时注册，铸令牌时才导入认证模块。

这避免了循环导入。

### 2、谁调用它

`app.channels.manager`的ChannelManager应用它的策略。

策略闭包`inject_github_credentials`在每个GitHub运行前执行。

`app.gateway.github.__init__`导入它触发注册。

harness侧的`deerflow.sandbox.tools`消费`run_context["github_token"]`。

## 四、重要性评级

### 1、评级

7分。

### 2、理由

这个模块是GitHub运行行为的调谐器。

没有它，GitHub运行没有凭据。

没有凭据，智能体无法在PR上做任何事。

它的几个决定很关键。

令牌必须是字符串。

这个决定源自SDK传输的JSON编码。

换形状会直接崩。

fire_and_forget避免了SDK的300秒读超时。

这是真实遇到的运行路径。

ask_clarification被禁用。

自主运行没有人类在场回答。

缓冲后续消息修复了忙线程静默丢评论的问题。

这个模块不改就不影响系统其他部分。

它是GitHub集成能自主干活的前提。

所以评7分。
