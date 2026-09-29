# app.gateway.github.dispatcher 档案

## 一、这个模块是干什么的

这个模块是GitHub webhook的分发器。

GitHub的webhook送达Gateway后先做HMAC验证。

验证通过后交给这个模块。

这个模块把一次webhook事件变成N条入站消息。

每条消息对应一个绑定了该仓库的智能体。

流程是这样的。

路由模块验证HMAC。

路由模块调用这个模块的`fanout_event`。

这个模块查找绑定的智能体。

这个模块过滤机器人事件。

这个模块丢弃冗余的评审评论噪音。

这个模块应用触发器过滤。

 surviving的消息发布到频道消息总线。

ChannelManager从总线上取消息。

ChannelManager创建线程并运行智能体。

智能体的回复最终作为GitHub评论发出。

这个模块刻意保持轻量。

这个模块不做任何LangGraph调用。

GitHub有10秒的送达超时。

轻量设计保证不会超时。

## 二、模块里的主要成员

### 1、fanout_event函数

这个函数是主入口。

这个函数的处理步骤很清晰。

第一步提取`(repo, number)`目标。

提取不出来就跳过。

第二步构建智能体注册表。

注册表构建放到线程里执行。

慢文件系统不会拖垮事件循环。

第三步查找匹配`(repo, event)`的智能体。

第四步做自事件过滤。

第五步做冗余评审评论过滤。

第六步应用触发器过滤。

第七步构建提示词并发布入站消息。

返回值是一个汇总字典。

字典里有matched、fired、skipped三组。

这个字典给运维排查用。

### 2、_is_self_event函数

这个函数判断事件是否由智能体自己触发。

智能体回复PR会再次触发webhook。

不过滤就会无限自我循环。

判断方法是比对`sender.login`。

比对时会剥掉`[bot]`后缀。

自身份集合的构建有优先级。

第一优先是`github.bot_login`。

第二优先是所有绑定的`mention_login`。

最后才是智能体名字。

智能体名字只在前面都没配置时使用。

这样真实用户的login恰好撞上智能体目录名不会被误杀。

其他机器人比如Copilot的事件是合法信号。

这些事件会正常通过。

### 3、_is_redundant_review_comment函数

这个函数识别评审评论的扇出噪音。

GitHub提交一次评审会同时触发两种事件。

一种是`pull_request_review`。

另一种是每个行内评论各触发一次`pull_request_review_comment`。

CodeRabbit一次评审能留二三十条行内评论。

这些伴随评论是重复投递。

识别特征是`pull_request_review_id`存在且`in_reply_to_id`不存在。

`in_reply_to_id`存在意味着是真正的回复。

回复必须触发。

这个函数只判断形状。

是否可以丢弃是每个绑定自己的事。

只有同时订阅了`pull_request_review`且该触发器不要求提及的绑定才能丢弃。

否则行内评论内容会全部丢失。

## 三、它和谁协作

### 1、它依赖谁

它依赖`app.channels.message_bus`发布入站消息。

它依赖`identity`提取目标和线程id。

它依赖`prompts`构建提示词。

它依赖`registry`查找绑定智能体。

它依赖`triggers`做触发判断。

它依赖`deerflow.config.agents_config`的配置模型。

### 2、谁调用它

`app.gateway.routers.github_webhooks`调用它。

webhook路由`POST /api/webhooks/github`验证HMAC后转交。

发布的消息由`ChannelManager`消费。

`GitHubChannel`是GitHub作为一等频道的实现。

## 四、重要性评级

### 1、评级

8分。

### 2、理由

这个模块是GitHub事件驱动智能体的核心枢纽。

没有它，webhook事件无法变成智能体运行。

它的过滤逻辑防住了两类实际问题。

一类是自我循环。

智能体回复自己会无限触发。

一类是评审评论噪音。

机器人评审一次产生几十条重复投递。

它的注释记录了多次评审修复的取舍。

这些取舍直接来自真实bug。

`require_mention`缺口问题尤其微妙。

误丢弃比保留冗余的代价大得多。

它是GitHub链路的单点。

但它不影响其他通道和其他功能。

所以评8分。
