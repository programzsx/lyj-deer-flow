# deerflow.agents.middlewares.summarization_middleware档案

源码路径是backend/packages/harness/deerflow/agents/middlewares/summarization_middleware.py。

这个文件约1041行，是middlewares目录里第二大的文件。

## 一、这个中间件是干什么的

这个模块是DeerFlow的上下文压缩系统。

对话会越来越长。

长对话会逼近模型的输入上限。

逼近上限时需要把旧对话压缩成一段摘要。

这个模块就是做这件事的。

这个模块扩展了LangChain官方的SummarizationMiddleware。

官方中间件在接近token上限时压缩对话。

DeerFlow在这个基础上加了很多能力。

这些能力包括压缩前钩子分发、模型候选回退、nostream标签、压缩审计、任务历史归档、PII脱敏、提示注入防御、profile降级。

自动压缩由before_model钩子触发。

手动压缩由/compact路由调用compact_state触发。

两条路径共用同一个工厂创建的中间件实例。

这样模型解析、钩子配置、保留默认值不会漂移。

## 二、模块里的主要成员

### 1、异常和数据结构

SummaryGenerationError是摘要生成失败的异常。

这个异常只在调用方通过raise_on_failure显式开启时抛出。

手动/compact路径开启这个开关。

这样真实失败能和"没有东西可压缩"区分开。

自动路径不开这个开关。

自动路径吞掉失败，保持压缩状态不变。

SummarizationEvent是压缩前发出的事件。

事件包含将被摘要的消息、被保留的消息、线程id、agent名和运行时。

ContextCompactionResult是压缩结果。

结果包含summary_text、被摘要的消息、被保留的消息、总token数和任务历史。

BeforeSummarizationHook是压缩前钩子的协议。

### 2、DeerFlowSummarizationMiddleware类

这个类继承LangChain的SummarizationMiddleware。

构造函数接收父类的参数，外加几个DeerFlow专属参数。

before_summarization是压缩前钩子列表。

task_continuity_config是任务连续性配置。

enabled为true才生效。

configured_model_name是显式配置的摘要模型。

None表示用运行自己的模型。

run_model_name是本轮运行实际执行的模型。

调用方直接传入这个值。

运行时上下文和get_config不携带自定义agent或子agent的解析模型。

所以由调用方传入更可靠。

anchor_model_name是锚点模型名。

锚点模型驱动父类的token计数器和profile检查。

摘要模型的三层关系如下。

锚点模型负责token计数。

配置的摘要模型是第一优先生成者。

运行自己的模型是回退生成者。

### 3、nostream标签

摘要模型的调用发生在中间件钩子内部。

调用的token流会被messages-tuple流回调捕获。

这会在前端广播出一条幻影AI消息。

构造时用_tag_nostream给模型副本打TAG_NOSTREAM标签。

流式处理器会跳过带这个标签的模型。

self.model保持不打标签。

父类的profile和ls_params检查仍然正常。

### 4、模型候选和缓存

_generation_candidate_names返回有序的去重候选名列表。

配置了摘要模型时候选是配置模型，然后是运行模型。

没配置时候选只有运行模型。

_model_for按名字构建nostream摘要模型。

名字匹配锚点就直接复用，不重建。

其他名字惰性构建并缓存。

构建失败缓存None。

这样坏掉的候选配置不会被反复重试。

也不会逃出fail-open边界。

### 5、摘要生成

_prepare_summary_prompt准备提示词。

没有要摘要的消息就返回固定文案"No previous conversation history."。

修剪后什么都不剩就返回"Previous conversation was too long to summarize."。

这两个固定文案是_CANNED_SUMMARIES集合的成员。

固定文案是合法摘要，短路模型调用。

_nonempty_summary规范化模型响应文本。

空白响应是生成失败。

提交空摘要会触发钩子并删除全部历史。

所以空响应按失败处理。

_summarize_with是同步生成入口。

遍历候选，每次尝试有完整生命周期。

构建、调用、文本提取、非空校验。

任何阶段失败都落到下一个候选。

全部失败就返回None。

_asummarize_with是异步对应版本。

_invoke_summary同步调用模型。

响应的text访问也在try内。

访问失败转换成候选失败，不逃出fail-open边界。

_ainvoke_summary异步调用模型。

异步版本会通过observe_system_model_call被系统模型调用扩展观察。

扩展用SystemOperationKind.SUMMARIZATION归因这次调用。

同步版本刻意不被扩展观察。

### 6、压缩主流程

compact_state是手动压缩入口。

acompact_state是异步对应版本。

流程分八步。

第一步调用_prepare_compaction。

第二步冻结来源内容的哈希。

第三步生成摘要。

生成失败按raise_on_failure决定抛异常还是返回None。

第四步触发压缩前钩子。

钩子只在有替换摘要时才触发。

摘要没有生成就先刷内存会造成重复。

第五步记录压缩审计。

第六步可选归档任务历史。

task_continuity_config存在时调用archive.capture。

第七步返回ContextCompactionResult。

### 7、_prepare_compaction

这个方法准备压缩。

流程如下。

先确保所有消息有id。

再读之前的summary_text。

统计token数。

非强制模式下不满足触发条件就返回None。

然后排除todo提醒消息。

todo提醒是state里todos的快照，不是对话历史。

排除后防止旧任务状态进入摘要。

再确定切割索引。

索引不大于0就返回None。

然后锁定最新的真实用户消息id。

当前请求必须存活。

再分区消息。

被摘要段和保留段分开。

然后调用_preserve_required_context抢救必需消息。

被摘要段为空就返回None。

### 8、_preserve_required_context

这个方法决定哪些消息不能被压缩。

三类消息被抢救出来。

第一类是SystemMessage。

SystemMessage是框架拥有的指令。

子智能体的整个系统提示就是state里的首个SystemMessage。

压缩它会让后续所有调用失去指令。

第二类是带标签的dynamic_context提醒。

第三类是最新真实用户消息。

按latest_user_id精确匹配。

这样首轮长分析保留自己的请求，早期的AI和工具轮次仍然压缩。

不带标签的__user消息刻意不抢救。

那是过期的历史请求。

那是跨轮提示污染的来源。

### 9、before_model和abefore_model

两个钩子调用_maybe_summarize和_amaybe_summarize。

这两个方法调用compact_state，force为false。

压缩有结果时返回状态更新。

更新用REMOVE_ALL_MESSAGES清空消息。

再放回保留段。

再写入summary_text。

可选写入task_history。

### 10、提示词构建和防御

_build_summary_prompt构建摘要提示词。

流程是修剪消息、格式化、修剪输入、脱敏、填充模板。

_build_summary_input_text修剪原始输入段。

trim_tokens_to_summarize为None就不修剪。

有值时把预算分给新消息和旧摘要。

有旧摘要时各分一半。

旧摘要用"last"策略修剪。

保留最近的尾部。

_build_summary_input_text还做HTML转义。

转义发生在修剪之后。

转义尖括号、与号。

不转义引号。

内容落在元素文本位置，不在属性值位置。

不转义的话"...</new_messages>..."这样的内容会提前闭合块。

这会给提取模型伪造一个权威段。

这是块突围防御。

和#4162、#4097是同一类防御。

修剪后转义是因为尾部省略号不能拆开一个实体。

_build_summary_prompt还做PII脱敏。

摘要模型直接从before_model调用。

这个调用点在PiiRedactionMiddleware的wrap_model_call之外。

所以压缩输入在这里显式调用redact_text脱敏。

摘要带上占位符。

DurableContextMiddleware回注的summary_text保持干净。

### 11、修剪和降级

_trim_summary_section_text用token计数器修剪文本。

修剪失败回退到确定性的文本截断。

_bound_text按头三分之二加尾三分之一的方式保留文本。

### 12、工厂函数create_summarization_middleware

这个函数创建配置好的压缩中间件。

lead的自动路径和手动压缩路径都经过这个工厂。

enabled为false返回None。

工厂从app_config读trigger、keep、trim_tokens_to_summarize、summary_prompt。

工厂用_build_summary_anchor构建锚点模型。

候选顺序是主生成模型、运行模型、默认模型、None。

每个候选都guarded构建。

一个坏掉的主构造不会导致agent构建失败。

会落到健康的运行模型。

全部构建失败返回None并警告。

工厂还调用_drop_unusable_fraction_clauses降级fraction子句。

LangChain父构造器在fraction子句无法解析时抛ValueError。

这会导致整个agent构建失败。

这是#3103。

降级逻辑是丢弃无法解析的fraction触发子句。

绝对子句保留。

fraction的keep回退到消息默认值。

模型没有声明context_window时profile不可用。

profile不可用时fraction子句无法解析。

所有触发子句都是fraction时trigger变成None。

这是"从不自动触发"的形状。

但手动压缩仍然可用。

手动压缩用force为true，不查触发子句。

工厂还装配内存刷新钩子。

memory.enabled且不跳过时挂memory_flush_hook。

子智能体链总是设置skip_memory_flush为true。

子智能体的内部轮次不能写进父线程的持久内存。

### 13、压缩审计

_freeze_compaction_sources给将被删除的每条消息做内容哈希。

哈希在摘要调用之前冻结。

摘要调用返回后这些消息已经不在state里。

"这些消息对应这个摘要"的映射只存在于当前栈帧。

必须现在捕获。

没有观察者注册就返回空。

没有观察者就不付O(上下文大小)的哈希成本。

_record_compaction构建CompactionEvent并调用notify_context_compacted。

事件带transform_kind为summarization、transform_version为1、来源哈希、输出哈希、压缩条数、保留条数。

哈希直接对message.content做canonical_hash。

不先str()。

DeerFlow的消息经常是多模态列表内容。

str()会按插入顺序渲染字典。

两个逻辑相同的消息会哈希出不同结果。

### 14、钩子分发

_fire_hooks构建SummarizationEvent并逐个调用钩子。

钩子失败只记录日志。

一个钩子的失败不影响其他钩子。

线程id和agent名从运行时上下文或LangGraph配置解析。

## 三、它和谁协作

在中间件链里这个中间件属于lead专属段。

这个中间件是可选的。

summarization.enabled开启时才装配。

上游是ThreadState的messages和summary_text。

下游是模型。

压缩产物summary_text由DurableContextMiddleware投影回模型请求。

这个模块依赖LangChain的SummarizationMiddleware基类。

依赖deerflow.models的create_chat_model构建摘要模型。

依赖pii_redaction_middleware的redact_text。

依赖todo_middleware的TODO_REMINDER_MESSAGE_NAME。

依赖dynamic_context_middleware的is_dynamic_context_reminder。

依赖message_utils的is_genuine_user_message。

依赖extensions的notify和CompactionEvent。

依赖task_continuity的archive。

依赖memory的summarization_hook。

手动压缩路径由app.gateway的compact路由调用。

路由调用compact_state并传force为true、raise_on_failure为true。

自动路径由before_model钩子驱动。

内存刷新钩子把被压缩消息刷进持久内存队列。

任务连续性归档把任务历史存档。

## 重要性评级

评级是8分。

理由如下。

长对话是智能体的常态。

没有压缩，智能体在token上限处直接崩溃。

这个模块是长会话可用性的支柱。

这个模块的工程质量很高。

模型候选回退让坏掉的摘要配置不瘫痪压缩。

profile降级让#3103不再炸掉agent构建。

块突围转义和PII脱敏处理了安全和隐私。

nostream标签处理了幻影消息。

压缩审计让每次压缩可追溯。

所以评级是8分。

不评9分以上的原因是压缩失败是软失败。

压缩不可用时智能体在短会话里仍然完全可用。

手动压缩也提供了一条逃生通道。

核心运行循环不依赖这个模块。
