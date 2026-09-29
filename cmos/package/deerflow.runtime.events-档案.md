# deerflow.runtime.events-档案

## 一、这个包是干什么的

这个包是DeerFlow的"运行事件目录与消息身份"包。

包名是`deerflow.runtime.events`。源码在`backend/packages/harness/deerflow/runtime/events/`。

大白话讲。DeerFlow每次运行都会产生事件。事件分几类。用户消息。AI回复。工具结果。运行开始结束。中间件动作。子代理生命周期。这些事件持久化后构成线程的"事件流"。前端的消息列表就是从这个事件流读的。

这个包负责三件事。

- 定义所有事件类型的规范名字和分类。这就是目录（catalog）。
- 定义持久化消息的稳定身份规则。前端和后端要靠这个对齐"哪条是同一条消息"。
- 把线程全局的feed序号（seq）附加到检查点消息上。

注意区分。这个包（`deerflow.runtime.events`）是目录和身份规则。它的子包`deerflow.runtime.events.store`才是事件存储。存储的档案是单独一份。

## 二、包里的主要成员

### 1、__init__.py

它只重新导出两个符号。`RunEventStore`和`MemoryRunEventStore`。都来自`store`子包。方便消费者直接导入。

### 2、catalog.py（事件目录）

这个模块定义持久化运行事件的规范名字和分类。生产者导入这些定义。不重复写事件名和分类对。公开JSON契约在后端测试里对照这个目录检查。任何一边单独改都会让CI失败。

核心类型两个。

- `RunEventDefinition`。冻结数据类。两个字段。`event_type`和`category`。构造时校验。名字非空。长度不超过持久化事件类型列宽。
- `RunEventPattern`。带参数的事件模式。比如`middleware:{tag}`。`event_type(suffix)`方法拼接后缀。后缀长度受列宽减前缀长度限制。

固定事件定义包括。

- 运行生命周期。`run.start`（trace）。`run.end`（outputs）。`run.error`（error）。
- 消息类。`llm.human.input`（message）。`llm.ai.response`（message）。`llm.tool.result`（message）。
- 追踪类。`llm.error`（trace）。
- 上下文类。`context:memory`（context）。
- 子代理类。`subagent.start`、`subagent.step`、`subagent.end`（都是subagent分类）。
- 工作区类。`WORKSPACE_CHANGES_EVENT`。复用`deerflow.constants`里的类型和分类。

中间件事件模式是`middleware:{tag}`。分类是middleware。已注册的tag有七个。`guardrail`、`loop_detection`、`safety_termination`、`skill_activation`、`skill_secrets`、`tool_promotion`、`tool_progress`。

分组导出。`JOURNAL_RUN_EVENT_DEFINITIONS`是journal产生的事件。`SUBAGENT_RUN_EVENT_DEFINITIONS`是子代理事件。`FIXED_RUN_EVENT_DEFINITIONS`是全部固定事件。

### 3、message_identity.py（消息身份）

这个模块定义持久化消息的稳定UI身份。

背景写在docstring里。线程feed（`run_events`）和检查点存着同一条消息。用的同一个id。客户端要能对齐它们。前提是两边对"同一条消息"的定义一致。这是后端一半。前端一半在`frontend/src/core/threads/hooks.ts`的`messageIdentity`。两边必须同步。不匹配是静默的。退化的是消息摆放位置。不会报错。

两个关键归一化。

- `ToolMessage`用它的`tool_call_id`识别。不用它自己的id。因为`tool_call_id`是两边都能解析的id。
- `DynamicContextMiddleware`会把提交的用户轮从`X`改键成`X__user`。把`X`让给注入的提醒。所以用户消息的两份副本必须折叠成一个身份。只折叠human副本。隐藏的SystemMessage合法地复用原始id。把它和可见轮合并会藏掉可见轮。

核心函数如下。

- `message_identity()`。返回消息的稳定身份。形式是`tool:{tool_call_id}`或`message:{message_id}`。没有则返回None。输入是序列化的消息映射。不是`BaseMessage`。
- `MESSAGE_SEQ_KEY`。常量`deerflow_seq`。消息的`additional_kwargs`键。携带消息在线程feed里的seq。这是服务器拥有的显示元数据。帧序列化时附加。客户端发回时必须剥掉。否则重放的消息会把它写进检查点。分支重新播种时会重新分配seq。
- `attach_message_seq()`。返回带seq的消息浅拷贝。不修改输入。这是同一个规则的两个对应方（worker的run范围stamper和请求范围的stamper）共享的唯一打点表达式。两边不会静默分叉。

### 4、message_seq.py（请求范围seq打点）

这个模块提供`stamp_messages_with_seq()`。

它解决的问题是。检查点自己不存seq。客户端把检查点和seq排序的feed合并时。如果加载的页面窗口已经够不到某条旧消息。这条消息就没法摆放。流式路径靠发布`values`帧时打点解决。但只是"打开"一个对话的客户端看不到帧。它通过REST读检查点。没有seq时。被总结拯救的早期消息只能按最近的锚点摆放。压缩后这个锚点会沉到页面深处（issue #4666）。

`stamp_messages_with_seq()`的行为。

- 输入是store、thread_id、消息列表。
- 先算每条消息的身份。收集想要的身份。
- 一次批量查询`store.get_message_seqs()`解析全部。检查点还持有的消息都已经持久化了。所以一次批量查找就够。没有以后要重试的东西。
- 逐条附加seq。只对查到身份的条目。
- 全程降级安全。store缺失、条目不是映射、身份feed不认识、查询失败。都退化为"没有seq"。不抛错。摆放是增强功能。没有它的客户端有自己的排序规则兜底。
- 输入永远不会被修改。拿到seq的条目浅拷贝。其他原样传递。

它是worker的run范围stamper的请求范围对应方。worker那半在`runs/worker.py`的`_MessageSeqStamper`里。

## 三、它和谁协作

### 1、上游

- `deerflow.constants`。提供事件类型和分类的列宽上限。以及工作区事件的类型分类。
- `deerflow.utils.messages`。提供`strip_injected_user_message_id_suffix()`。用于human副本的id折叠。
- `deerflow.runtime.events.store`。子包。`stamp_messages_with_seq()`的store参数就是`RunEventStore`。

### 2、下游（被谁用）

全仓库搜索`from deerflow.runtime.events`的导入引用有136处（不含runtime自身）。其中本包（不含store子包）的引用文件包括。

- `backend/packages/harness/deerflow/runtime/journal.py`。事件生产者。导入catalog里的全部固定事件定义。
- `backend/packages/harness/deerflow/runtime/runs/worker.py`。seq打点、消息身份、子代理事件。
- `backend/packages/harness/deerflow/agents/middlewares/`下的多个中间件。`loop_detection_middleware`、`safety_finish_reason_middleware`、`skill_activation_middleware`、`tool_progress_middleware`、`tool_promotion_audit_middleware`。它们用`MIDDLEWARE_EVENT_PATTERN`和tag常量。
- `backend/packages/harness/deerflow/guardrails/middleware.py`。guardrail事件。
- `backend/packages/harness/deerflow/subagents/step_events.py`。子代理事件生产。
- `backend/packages/harness/deerflow/utils/messages.py`。消息身份辅助。
- `backend/app/gateway/`。`conversation_reader.py`、`deps.py`、`routers/threads.py`、`services.py`。REST端点做seq打点和身份解析。
- `backend/packages/harness/deerflow/persistence/models/__init__.py`。持久化模型导出。

### 3、依赖方向

这个包属于harness层。不导入app层。它的依赖非常轻。只有常量、消息工具和子包。

## 四、重要性评级

评级是7分。

理由如下。

这个包定义的是契约。事件目录是所有事件生产者的公共词汇表。消息身份是前后端对齐的规则。seq打点是消息摆放正确的关键。

它被引用的地方多。全仓库导入引用有136处（含store子包）。只看本包的引用。中间件五个文件、journal、worker、gateway四个文件、子代理、guardrails都在用。事件目录几乎被每个产生事件的组件导入。

它是消息展示链路的必经点。前端的消息列表、子任务卡片、中间件事件的展示。全部依赖这个目录的名字和分类。消息身份错了。前端的消息摆放会静默错位。

删除它会怎样。journal和所有中间件导入目录会失败。后端直接无法启动。seq打点删除后。压缩过的长线程在REST打开时消息摆放会退化（issue #4666的回归）。

为什么是7分不是更高分。它的代码量小。总共约1万字节。四个代码文件。它定义契约但不实现存储和运行逻辑。存储在子包里。运行在runs里。它更像公共词汇表和两个小工具。

为什么不是更低分。它是事件生产者和消费者之间不可缺的中间层。任何事件名字改动都从这里过。消息身份规则是前后端契约的后端半边。删掉它没有任何机制能保证两边一致。
