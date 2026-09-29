# app.gateway.github.prompts 档案

## 一、这个模块是干什么的

这个模块把GitHub webhook的payload翻译成智能体的提示词。

每种支持的事件有自己的模板。

输出是一个人类可读的字符串。

这个字符串作为`role: user`消息喂给智能体。

设计上有几个要点。

要点一是提示词是描述式的。

提示词说"一个PR被打开了"。

提示词不说"去评审这个PR"。

行为定义留给智能体的SOUL.md。

分发器在末尾追加一句简短指令。

这样默认SOUL也能做出有用动作。

要点二是频道层在出站路径只做日志。

智能体的最终消息只进运行日志。

智能体的最终消息不会发回GitHub。

智能体想在PR上回复。

它必须在运行中自己调用`gh`命令。

要点三是评论正文原样嵌入。

人类实际打了什么对智能体最有用。

不做转义。

智能体看得懂markdown。

要点四是不放原始payload JSON。

那是噪音。

## 二、模块里的主要成员

### 1、build_prompt函数

这个函数是主入口。

这个函数按事件名查模板表。

表里有六种事件。

事件是ping、pull_request、issues、issue_comment、pull_request_review、pull_request_review_comment。

未知事件返回通用桩。

通用桩让分发器照样能开运行。

这样新事件类型先启用也不会崩。

### 2、_truncate函数

这个函数截断长字段。

默认上限4000字符。

截断后加`[…truncated…]`标记。

一个坏的payload不能撑爆上下文窗口。

### 3、各事件的模板函数

`_pull_request_prompt`渲染PR事件。

模板带PR编号、标题、作者、URL、描述。

末尾告诉智能体自己调`gh pr comment`。

`_issues_prompt`渲染issue事件。

模板结构和PR类似。

末尾提示可以`gh issue comment`或`gh pr create`。

`_issue_comment_prompt`渲染issue评论事件。

这个模板多一个父上下文块。

父上下文由`_render_parent_context`渲染。

父issue或父PR的标题、作者、描述都在。

智能体能在父上下文里理解评论。

`_pr_review_comment_prompt`渲染评审行内评论事件。

模板带文件路径、行号、diff上下文。

diff hunk单独截断到2000字符。

`_pr_review_prompt`渲染评审提交事件。

这个模板带一个抓取提示。

评审事件只带评审的顶层总结。

行内评论是单独的webhook投递。

分发器会对同时订阅评审事件的绑定抑制那些行内评论。

抑制了就必须告诉智能体去哪拿。

提示是调`gh api`拉取评论。

没有review id时提示不渲染。

这样不会出现坏的API路径。

`_ping_prompt`渲染ping事件。

ping在webhook首次安装时到达。

通常不触发。

模板只为完整性。

## 三、它和谁协作

### 1、它依赖谁

它没有外部依赖。

纯字符串处理。

### 2、谁调用它

`app.gateway.github.dispatcher`调用它。

分发器在触发器通过后调`build_prompt`。

产出的提示词放进`InboundMessage.text`。

ChannelManager把文本作为运行输入。

智能体的SOUL.md消费这些描述式上下文。

## 四、重要性评级

### 1、评级

6分。

### 2、理由

这个模块决定智能体看到什么。

智能体的行为质量直接依赖提示词质量。

它处理了几个真实的坑。

坑一是出站不发回GitHub。

这个语义必须显式告诉智能体。

否则智能体会误以为最终消息会出现在PR上。

坑二是评审事件的行内评论缺失。

抓取提示让抑制过滤和提示词不再互相打架。

坑三是长payload截断。

这个模块是纯函数。

没有状态。

没有I/O。

它不影响系统的运行骨架。

缺了它GitHub集成不可用。

但它本身容易替代。

所以评6分。
