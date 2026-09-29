# deerflow.agents.memory.backends.deermem.deer_mem 模块档案

源文件是backend/packages/harness/deerflow/agents/memory/backends/deermem/deer_mem.py。

文件共711行。

## 一、这个模块是干什么的

这个模块定义了DeerMem类。

DeerMem是DeerFlow记忆系统的默认后端。

一句话概括DeerMem的职责。

DeerMem把"用户聊过的内容"变成"可复用的记忆"。

然后DeerMem把记忆注入到后续对话里。

具体展开。

用户和智能体对话。

DeerMem过滤对话内容。

DeerMem用LLM从对话里提取"事实"（fact）。

DeerMem把事实存到本地文件。

下次对话时DeerMem把事实格式化后注入提示词。

这样智能体就能记住用户之前说过的话。

DeerMem实现了一个抽象基类的契约。

这个基类是MemoryManager。

MemoryManager来自deerflow.agents.memory.manager模块。

DeerMem是MemoryManager的子类。

DeerMem自己不直接干活。

DeerMem是一个"组装层"。

DeerMem把五个core模块组装起来。

五个core模块是storage（存储）、queue（队列）、updater（更新器）、prompt（提示词）、message_processing（消息处理）。

这五个模块都在同目录的deermem/core/文件夹下。

### （一）设计意图：为什么要有这个类

背景是记忆系统做过一次抽象重构。

重构之前记忆逻辑写在一个middleware里。

重构之后逻辑搬进了DeerMem。

重构的目的是让记忆后端可以替换。

除了DeerMem还有mem0、openviking、honcho这些可选后端。

这些后端在backends/目录的兄弟文件夹里。

DeerMem是自包含的本地默认实现。

DeerMem不依赖外部服务。

DeerMem的数据存在本地文件里。

DeerMem有意不把私有逻辑放进抽象基类。

私有逻辑包括过滤、信号检测、`<memory>`标签包装、enabled开关。

这些私有逻辑都留在DeerMem自己身上。

抽象基类只放公共契约。

这样做是为了不让别的后端被迫实现DeerMem特有的东西。

### （二）主要成员：模块级辅助函数

#### 1、_resolve_agent_name函数

这个函数把agent_name转成小写。

agent_name是None时返回DEFAULT_AGENT_BUCKET。

DEFAULT_AGENT_BUCKET是`__default__`。

这个默认桶名是保留名。

`__default__`不能被任何自定义智能体占用。

DeerMem的全部存储和检索都用这个规范化后的名字。

这样"LeadAgent"和"leadagent"会落进同一个桶。

#### 2、_call_backend函数

这个函数做错误翻译。

参数operation是一个可调用对象。

函数执行operation。

执行时捕获DeerMem私有的存储异常。

私有的MemoryRevisionConflict异常被翻译成公共的MemoryConflictError。

私有的MemoryStorageCorruption异常被翻译成公共的MemoryCorruptionError。

为什么要翻译。

因为上层（Gateway）只认识公共错误类型。

Gateway把MemoryConflictError映射成HTTP409。

Gateway把MemoryCorruptionError映射成稳定的HTTP500。

DeerMem所有对storage和updater的调用都包在_call_backend里。

#### 3、_legacy_source_value函数

这个函数把结构化的source元数据投影回旧的公共字符串。

source是事实的来源字段。

source是字符串时直接返回。

source不是字典时返回"unknown"。

source是字典时按优先级取值。

type等于"conversation"且有threadId时返回threadId。

type是非空字符串时返回type。

否则有threadId时返回threadId。

都没有时返回"unknown"。

#### 4、_compat_document函数

这个函数做兼容性转换。

参数是记忆数据字典。

函数深拷贝整个字典。

然后遍历所有facts。

每个fact的source字段经过_legacy_source_value转换。

目的是对外返回历史形状的数据。

持久化格式不变。

只有对外暴露的形状被转换。

get_memory、search、import_memory等所有对外读路径都用这个函数。

### （三）主要成员：DeerMem类的私有属性和类属性

#### 1、私有依赖（PrivateAttr）

DeerMem声明了六个私有属性。

这些属性用pydantic的PrivateAttr声明。

私有属性是_config、_storage、_llm、_updater、_queue、_trivial_patterns。

为什么用PrivateAttr而不用普通字段。

这些依赖是非pydantic对象。

storage、llm、queue都不能参与校验和序列化。

所以它们不能是pydantic字段。

#### 2、supports_search类属性

supports_search是ClassVar，值为True。

DeerMem实现了真正的search方法。

所以DeerMem可以用mode="tool"模式。

基类有一个校验。

tool模式要求后端支持search。

不支持search的后端继承False默认值。

这些后端就不能用tool模式。

#### 3、检索预热相关私有状态

model_post_init还设置了三个检索状态。

_retrieval_lock是一个threading.RLock。

_retrieval_warmed_scopes是一个set，记录已预热的(userId,agentName)组合。

_retrieval_fully_warmed是一个布尔值。

这三个状态支撑检索索引的惰性重建。

### （四）主要成员：构造与工厂

#### 1、model_post_init方法

这个方法是依赖组装的核心。

它在pydantic字段校验之后运行。

它从self.backend_config解析出配置。

解析流程分几步。

第一步调用DeerMemConfig.from_backend_config得到self._config。

第二步调用create_storage(self._config)创建self._storage。

第三步加载模式检测的YAML模式文件。

先加载"trivial"模式。

然后遍历SIGNAL_NAMES逐个加载信号模式。

这里有一个设计考量。

模式文件在构造时预加载。

如果patterns_dir配错了（文件缺失或YAML非法）。

错误会在启动时暴露。

而不是在第一次更新时才暴露。

第四步选择LLM。

host_llm优先。

host_llm是宿主注入的默认模型。

host_llm为None时才调用build_llm(self._config.model)。

这样零配置的DeerMem也能做提取。

因为它借用应用的默认模型。

第五步创建MemoryUpdater。

 updater拿到config、storage、llm、prompts_dir和callbacks。

第六步校验全局提示词模板。

仅当prompts_dir被显式设置时才校验。

校验方式是用哑变量加载三个模板并format一次。

三个模板是staleness_review、consolidation、memory_update。

配置错了会在启动时大声失败。

而不是静默丢更新。

每个智能体的覆盖模板无法在这里知道。

覆盖模板在首次使用时由updater惰性校验。

最后一步创建MemoryUpdateQueue。

queue拿到config和updater。

#### 2、from_config类方法

这是推荐的工厂方法。

参数是backend_config字典、mode和一组宿主钩子。

宿主钩子以kwargs形式传入。

钩子不是放进backend_config的。

方法把DeerMem消费的钩子合并进config_dict。

被合并的钩子是should_keep_hidden_message、trace_context_manager、extraction_callback、judge。

然后处理host_llm。

只有当config_dict里没有host_llm时才处理。

只有当model配置为空时才调用host_llm_factory()。

为什么要这样判断。

如果已经配置了model。

再构建一个用不上的宿主默认模型会浪费启动时间。

然后调用cls(backend_config=config_dict,mode=mode,...)构造实例。

真正的依赖组装发生在model_post_init里。

构造完成后有一个关键动作。

instance.backend_config被恢复成宿主传入的原始数据。

注入的钩子从backend_config里移除。

为什么这样做。

backend_config字段要保持可序列化。

README契约规定钩子以from_config的kwargs形式到达。

钩子活在self._config里。

钩子不活在backend_config字段里。

#### 3、refresh_judge方法

这个方法在宿主配置热重载后替换记忆判官。

实现只有一行。

self._config.judge = judge。

为什么这样就能生效。

_config被updater和queue共享。

修改_config会传导到每个判官调用点。

不需要重建storage、llm或queue。

judge传None表示双方都关闭。

下一批更新起判官就不工作了。

### （五）主要成员：写入路径

#### 1、_prepare_update方法

这是写入前的预处理核心。

参数是消息列表。

返回值有两种。

返回None表示没有有意义的对话。

返回(filtered,signals)元组表示可以继续。

处理流程分四步。

第一步用filter_messages_for_memory过滤。

只保留用户消息和最终的AI消息。

should_keep_hidden_message钩子在这里生效。

第二步用filter_trivial过滤琐碎消息。

琐碎消息指纯确认类的应答。

模式来自构造时加载的_trivial_patterns。

第三步检查剩余消息。

必须同时存在human类型和ai类型消息。

缺任何一种就返回None。

第四步用detect_signals检测信号。

信号是从最近几轮里检测出的类别集合。

信号被转成frozenset返回。

#### 2、add方法

这是常规写入入口。

调用方是MemoryMiddleware.after_agent。

流程是先预处理再入队。

预处理返回None就直接返回。

然后调用self._queue.add入队。

入队带上了agent_name、user_id、trace_id和signals。

agent_name经过_resolve_agent_name规范化。

这里有一个重要的背压设计。

队列满了抛QueueFull。

DeerMem捕获QueueFull。

DeerMem记录warning然后丢弃这次更新。

为什么不往上抛。

因为异常传到MemoryMiddleware.after_agent会打断智能体运行。

丢弃是安全的。

被丢弃的更新下一轮会被重新喂进来。

middleware每轮传完整对话。

水位线在没有入队的轮次不会前进。

#### 3、add_nowait方法

这是紧急写入入口。

调用方是memory_flush_hook。

使用场景是摘要即将删除消息之前。

先把消息内容抢救进记忆。

流程和add一样。

先预处理再入队。

区别是入队调用的是queue.add_nowait。

队列会立即flush。

这里也捕获QueueFull。

注释说紧急路径在背压下总是被放行。

所以QueueFull理论上不该发生。

但紧急flush由summarization_hook调用。

异常传播会打断摘要流程。

所以还是捕获加记录日志。

这是防御性编程。

### （六）主要成员：读取路径

#### 1、get_context方法

这是记忆注入的入口。

middleware模式注入选定agent的事实加用户全局摘要。

tool模式只注入全局摘要。

tool模式下事实藏在memory_search工具后面。

这样事实不会在提示词和检索结果里重复出现。

处理流程分几步。

第一步确定injection_agent。

tool模式下是None。

middleware模式下是规范化后的agent_name。

第二步通过updater取记忆数据。

取数据包在_call_backend里做错误翻译。

第三步处理相关性排序。

条件是retrieval_relevance_enabled开启且query非空。

条件还要求retrieval_relevance_weight大于0。

满足条件时用当前作用域的事实语料构建IDF。

IDF在预算分池之前构建。

分词器和搜索用的是同一个有界分词器。

第四步调用format_memory_for_injection格式化。

传入令牌预算、保证类别、保证类别预算、query和权重。

格式化参数全部来自DeerMemConfig。

enabled开关和`<memory>`包装留在调用点。

这个方法只返回正文。

#### 2、search方法

这是检索的统一入口。

先做参数防御。

query为空或top_k小于等于0时返回空列表。

然后分三条检索路径。

第一条是相关性检索。

条件是retrieval_relevance_enabled开启。

走_relevance_search。

第二条是FTS5全文检索。

默认路径走_fts5_search。

第三条是子串兜底检索。

FTS5无结果时走_substring_search。

兜底设计有明确意图。

检索出错不能让记忆不可用。

子串匹配是最后的保底手段。

检索成功后还有一个副作用。

条件是驱逐策略为hybrid-v1或影子模式开启。

命中结果的事实ID被记录访问热度。

访问热度是驱逐的提示信号。

只有search会记录热度。

提示词注入和get_context不记录热度。

记录热度失败只记日志。

副作用绝不能让search丢结果。

#### 3、_fts5_search方法

这个方法走存储层的检索适配器。

先从storage上拿search_facts方法。

storage没有这个方法时视为不可用。

然后调用_ensure_retrieval_scopes保证作用域索引已建。

再调用search_facts。

mode是"hybrid"。

category作为过滤器传入。

整个过程包在try里。

适配器失败时记录异常并退回空列表。

上层会继续走子串兜底。

有结果时通过_compat_document转换成公共事实形状。

#### 4、_substring_search方法

这是保底检索。

实现很简单。

把query转小写。

取出全部记忆数据。

逐个fact检查content是否包含query。

category过滤同时应用。

命中结果按_coerce_source_confidence排序。

置信度高的排前面。

取前top_k个。

再经_compat_document转换。

#### 5、_relevance_search方法

这是可选的确定性排序检索。

对应issue#4495。

候选不限于字面子串匹配。

作用域内所有fact都参与竞争。

排序由order_facts_for_query完成。

排序综合词法相关性和置信度。

然后做多样性去重。

category过滤在top_k切片之前应用。

调用方持有的fact字典不会被修改。

#### 6、_ensure_retrieval_scopes方法

这个方法惰性重建检索索引。

前提是预热被跳过了。

方法先做 hasattr 防御。

三个检索状态不存在时就地补建。

这处理了直接构造绕过某些初始化的情况。

然后检查storage有没有rebuild_index方法。

没有就直接返回。

有就加锁处理。

_retrieval_fully_warmed为True时直接返回。

检索未配置时把作用域标记为已处理。

否则逐个作用域重建。

已预热的作用域跳过。

重建失败记日志继续。

重建成功且非致命时标记该作用域已预热。

锁用RLock保证并发安全。

### （七）主要成员：管理路径

#### 1、get_memory方法

读取一个作用域的完整记忆文档。

先取数据再经_compat_document转换。

#### 2、cancel_by_agent方法

删除或清空作用域时丢弃待处理的防抖队列上下文。

agent_name为None时取消所有agent桶。

agent_name非None时只取消该桶。

user_id为None只匹配旧的无用户存储根。

user_id为None不匹配所有排队的用户。

这个语义和clear_memory保持一致。

#### 3、clear_memory方法

清空一个作用域的记忆。

流程有三个关键步骤。

清空前先cancel_by_agent。

然后调用updater的clear_memory_data或clear_all_memory_data。

清空后再cancel_by_agent一次。

为什么要取消两次。

防止一个过期的防抖定时器在清空期间或清空之后改写事实。

#### 4、import_memory方法

导入外部记忆数据。

调用updater的import_memory_data。

结果经_compat_document转换。

### （八）主要成员：生命周期路径

#### 1、shutdown_flush方法

优雅关停时在timeout内排空防抖队列。

委托给queue的flush_sync。

flush_sync先join正在执行的worker。

已被Timer取走的上下文不会在退出时丢失。

其余队列在守护线程上排空。

有真实的硬超时。

因为记忆更新的LLM调用是同步的。

同步调用无法被中断。

只有真正在timeout内完成排空才返回True。

#### 2、close方法

关闭派生的检索资源。

调用storage的close。

关闭发生在待处理更新排空之后。

### （九）主要成员：三级可选钩子

抽象基类定义了几个可选钩子。

基类给了默认实现。

warm默认返回None。

reload_memory和fact CRUD默认抛NotImplementedError。

DeerMem覆写了自己支持的那些。

调用方直接调用并捕获NotImplementedError。

调用方不再用hasattr探测。

#### 1、warm方法

预热线程计数资源。

retrieval_relevance_enabled开启时调用warm_tokenizer。

这是给可选的jieba分词器用的。

token_counting为"char"时记日志并返回True。

char模式不用tiktoken。

不需要预热。

其余情况调用warm_tiktoken_cache。

返回编码是否加载成功。

#### 2、warm_retrieval方法

在服务流量之前重建完整的派生检索索引。

storage没有rebuild_index时返回True。

没有索引就不需要预热。

重建结果fatal时返回False。

有fact被跳过但索引可用时记warning。

索引可用时加锁标记fully_warmed。

并清空逐作用域的预热记录。

Gateway lifespan在事件循环外直接调用这个方法。

#### 3、reload_memory方法

丢弃缓存的记忆文档并从磁盘重新加载。

调用updater的reload_memory_data。

#### 4、create_fact、delete_fact、update_fact方法

这三个是事实级CRUD。

分别调用updater的create_memory_fact、delete_memory_fact、update_memory_fact。

create_fact返回记忆数据和新建的fact_id。

三个方法的返回都经_compat_document转换。

这些方法供Gateway管理端点和memory工具使用。

工具模式的CRUD不走提取门控。

#### 5、未覆写的钩子

delete_memory和export_memory继承基类的二级默认实现。

基类默认抛NotImplementedError。

注释说这两个是死契约。

零调用方。

/memory/export路由走get_memory。

所以DeerMem不再重复抛出。

### （十）它和谁协作

#### 1、它依赖谁

上游契约来自deerflow.agents.memory.manager。

MemoryManager是基类。

MemoryConflictError和MemoryCorruptionError是公共错误类型。

配置来自同目录deermem/config.py的DeerMemConfig。

五个core模块是它的工作引擎。

core/eviction.py提供EVICTION_POLICY_HYBRID_V1常量。

core/llm.py提供build_llm。

core/message_processing.py提供SIGNAL_NAMES、detect_signals、filter_messages_for_memory、filter_trivial、load_patterns。

core/paths.py提供DEFAULT_AGENT_BUCKET。

core/prompt.py提供format_memory_for_injection、load_prompt、load_prompt_messages、warm_tiktoken_cache。

core/queue.py提供MemoryUpdateQueue和QueueFull。

core/relevance.py提供build_idf、order_facts_for_query、tokenize、warm_tokenizer。

core/storage.py提供MemoryRevisionConflict、MemoryStorageCorruption、create_storage。

core/updater.py提供MemoryUpdater和_coerce_source_confidence。

#### 2、谁调用它

工厂机制发现MANAGER_CLASS。

同目录__init__.py导出MANAGER_CLASS=DeerMem。

工厂的_scan_backends在文件夹名deermem下发现它。

MemoryMiddleware调用add做被动捕获。

summarization_hook调用add_nowait。

memory工具调用search和fact CRUD。

Gateway调用get_memory、reload_memory、clear_memory、import_memory。

Gateway lifespan调用warm和warm_retrieval和shutdown_flush和close。

宿主配置热重载调用refresh_judge。

#### 3、线程模型

队列在后台Timer线程上跑更新。

检索重建用RLock保护。

更新排队和检索预热是并发敏感区。

add的背压降级和cancel的双重取消都是为并发正确性服务的。

## 十一、重要性评级

评级是9分。

理由如下。

DeerMem是整个记忆系统的默认后端。

DeerFlow的记忆功能全部经过这个类。

没有DeerMem就没有开箱即用的记忆。

这个类的职责覆盖写入、读取、检索、管理、生命周期五个方向。

这个类的行为契约非常细。

背压降级、双重取消、错误翻译、兼容形状转换、启动期校验。

这些细节都是数据正确性和服务稳定性的关键。

检索路径有三层降级设计。

相关性排序、FTS5、子串兜底。

这保证检索永远不把记忆变成不可用。

这个类是理解记忆系统抽象重构成果的核心样本。

扣掉1分的理由。

这个类本身是组装层。

最重的逻辑在五个core模块里。

core模块的任何修改都会影响这个类的行为。

单独理解这个文件不足以理解全部实现。
