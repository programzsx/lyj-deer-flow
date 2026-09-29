# build_prompt-档案

## 一、这个类是干什么的

build_prompt不是类。

build_prompt是app/gateway/github/prompts.py里的模块级函数。

这个函数把GitHub webhook载荷翻译成给代理的提示。

每个支持的事件有自己的模板。

输出是单个人类可读的字符串。

作为role: user消息喂给代理。

设计要点如下。

提示是描述性的。例如"a PR was opened on ..."。

不是命令式的。例如"review this PR"。

这样代理的SOUL.md定义行为。

派发器在末尾附加一条简短指令。

stock lead_agent的SOUL也能做有用的事。

渠道层在出站路径上是仅日志。

代理的最终消息进gateway.log。

不发到GitHub。

代理想在PR上回复必须在运行期间自己调用gh。

嵌入评论body的原因是那是最有用的信号。

代理需要看人类实际输入了什么。

不escape它。代理理解markdown。

绝不包含原始payload JSON。那是噪音。

这个模块位于backend/app/gateway/github/prompts.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、_truncate函数

这个函数修剪长字段。

单个坏payload不能吹爆上下文窗口。

默认4000字符。

截断标记是[...truncated...]。

### 2、各事件模板

- _pull_request_prompt渲染PR事件。包含编号、标题、作者、URL、描述。
- _issue_comment_prompt渲染issue评论。渲染父issue或PR的头部块。
- _pr_review_comment_prompt渲染PR评审评论。包含文件路径、行号、diff上下文。diff hunk截断到2000。
- _pr_review_prompt渲染PR评审。它带fetch_hint。提示代理用gh api取回内联评论。
- _issues_prompt渲染issue事件。
- _ping_prompt渲染ping事件。无需操作。

每个模板都告诉代理。

最终助手消息只用于运行日志。不会发到GitHub。

想回复就在运行期间自己调用gh命令。

### 3、fetch_hint细节

这个payload只带review自己的顶层摘要。

reviewer留下的内联评论作为单独的pull_request_review_comment投递到达。

派发器对也监听pull_request_review的绑定把那些抑制为冗余扇出。

抑制只有在代理真的从这里恢复内联内容时才是真正冗余的。

所以要告诉它怎么取。

没有这个提示，过滤器和提示互相打架。

过滤器抑制了唯一携带内联内容的事件。

而没有任何东西告诉代理去取。

review_id或PR号缺失时不渲染提示。

指令不渲染坏的gh api路径。

### 4、_render_parent_context函数

这个函数把事件挂着的issue或PR渲染成头部块。

webhook payload的issue或pull_request对象已带标题、body、作者。

第一层上下文不需要额外的API调用。

### 5、build_prompt函数

这是主函数。

未知事件得到通用stub。

派发器仍然能启动运行而不崩溃。

新事件类型在本模块更新之前启用时有用。

## 三、它和谁协作

- dispatcher.py的fanout_event调用build_prompt。
- GitHubChannel.send()是仅日志的出站路径。
- 代理自己通过gh CLI回复。

## 四、重要性评级

评级是6分。

理由如下。

这个模块是GitHub事件的提示翻译层。

描述性提示让SOUL.md定义行为。

fetch_hint修复了过滤器和提示互相打架的问题。

评论body原样嵌入。

坏payload的截断防上下文爆炸。

但它只服务于GitHub通道。

是模板渲染。

扣掉4分。
