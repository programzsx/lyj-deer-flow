# deerflow.agents.memory.backends.deermem.deermem.config 模块档案

源文件是backend/packages/harness/deerflow/agents/memory/backends/deermem/deermem/config.py。

文件共420行。

## 一、这个模块是干什么的

这个模块定义DeerMem自己的配置模型。

模块里有两个pydantic模型。

一个是DeerMemModelConfig。

一个是DeerMemConfig。

一句话概括职责。

这个模块决定DeerMem的一切可调行为。

存储在哪里、用哪个LLM提取、队列等多久、事实存多少、注入多少token、过期怎么删。

这些都由这里的字段控制。

背景是记忆系统做过一次抽象重构。

重构之后配置被拆成两层。

共享层只放宿主关心的字段。

共享层是MemoryConfig。

MemoryConfig在deerflow/config/memory_config.py。

共享字段只有四个。

四个字段是enabled、injection_enabled、manager_class、backend_config。

DeerMem私有层放这里。

DeerMem私有配置不放在共享MemoryConfig上。

工厂把backend_config（一个dict）传给DeerMem。

DeerMem再把dict解析成DeerMemConfig。

默认值让DeerMem在没有任何backend_config时也能跑。

这叫零配置运行。

字段名有意镜像重构前的MemoryConfig私有字段。

这样迁移是一次纯粹的搬移。

用户原来的config.yaml写法memory.<field>。

迁移后变成memory.backend_config.<field>。

字段名不变。

### （一）模块定位

这个模块属于DeerMem后端包的deermem子包。

deermem子包还有deer_mem.py和core/目录。

本模块只放配置。

本模块不含任何行为逻辑。

行为逻辑在deer_mem.py和core/模块里。

### （二）主要成员：DeerMemModelConfig

这是记忆更新LLM的子配置。

这是一个嵌套的pydantic模型。

内容就是langchain的init_chat_model参数。

#### 1、provider字段

类型是str|None，默认None。

provider是langchain的model_provider。

例如"openai"。

None时默认按"openai"处理。

DeepSeek和其他OpenAI兼容网关用"openai"加base_url。

#### 2、model字段

类型是str|None，默认None。

model是模型名。

None表示没有配置LLM。

没有LLM时非LLM操作仍然能工作。

更新操作会抛异常。

#### 3、api_key字段

类型是str|None，默认None。

API密钥不填时依赖provider的环境变量。

#### 4、base_url字段

类型是str|None，默认None。

base_url用来覆盖接口地址。

例如指向一个OpenAI兼容网关。

#### 5、temperature字段

类型是float|None，默认None。

采样温度。

这个模型被core/llm.py的build_llm消费。

### （三）主要成员：DeerMemConfig的字段分组

DeerMemConfig是核心配置模型。

字段很多。

字段按功能分组。

分组用注释分节。

下面逐组讲。

#### 1、提示词扩展字段

prompt_prepend和prompt_append。

类型是str，默认空字符串，strict=True。

这两个字段是运维人员的字面指令。

prompt_prepend被前置到记忆更新的系统消息。

prompt_append被追加到记忆更新的系统消息。

这两个字段不参与模板format。

它们是字面文本。

#### 2、存储组字段

storage_path是数据根目录。

默认空字符串。

空字符串表示用默认位置。

默认位置是$DEERMEM_DATA_DIR环境变量或~/.deermem/。

每个用户的记忆在{root}/users/{user_id}/memory.json。

任何值（绝对或相对路径）都被当作根目录。

storage_class是存储实现类。

默认空字符串。

空表示用FileMemoryStorage。

"file"别名也是FileMemoryStorage。

"markdown"别名是MarkdownMemoryStorage。

markdown实现有容错加载路径，磁盘上仍是JSON。

也可以填一个点分类路径换自定义存储。

默认空时不做importlib，保持可移植。

strict_user_scope是布尔值，默认False。

True时每个存储作用域都要求user_id。

False保留无认证模式和旧调用方的行为。

manifest_filename是用户全局摘要JSON文件名。

默认"memory.json"。

必须是一个普通的.json文件名。

file_lock_timeout_seconds是跨进程文件锁的最大等待秒数。

默认10，范围1到120。

retrieval_adapter是检索适配器工厂。

默认"fts5"。

"fts5"是默认的SQLite全文检索。

空字符串表示禁用适配器。

点分工厂路径会接到DeerMemConfig并实现RetrievalPort。

retrieval_relevance_enabled为true时搜索绕过适配器。

但索引仍然按配置维护。

#### 3、事实去重字段

fact_dedup_enabled是布尔值，默认False。

这是可选的确定性近似重复门控，对应issue#5252。

开启时一个新的拟写入事实会被检查。

检查方式是有界token-Jaccard相似度。

比较对象是同一user/agent作用域且同一category的既有事实。

相似度达到fact_dedup_similarity_threshold时合并。

合并语义分几条。

保留既有的id、content、createdAt。

confidence提升为max(旧值，新值)。

只有confidence提升时才刷新source。

纠错替换和拟删除目标不参与近似去重。

False时完全保留旧行为。

fact_dedup_similarity_threshold是相似度阈值。

默认0.7，范围0.5到1.0。

只在fact_dedup_enabled为true时使用。

#### 4、相关性检索字段

retrieval_relevance_enabled是布尔值，默认False。

这是可选的相关性感知检索，对应issue#4495。

开启时search绕过retrieval_adapter。

包括绕过FTS5和自定义工厂。

memory_search按确定性词法相关性对作用域内全部事实排序。

没有字面子串匹配的相关事实也能被返回。

提示词注入按当前query对事实排序。

False时完全保留旧的按置信度排序行为。

retrieval_relevance_weight是词法相关性对置信度的混合权重。

默认0.5，范围0.0到1.0。

0.0表示只用置信度。

1.0表示只用相关性。

只在相关性检索开启时使用。

retrieval_diversity_weight是贪心MMR相似度惩罚权重。

默认0.0，范围0.0到1.0。

用来在排序中降低近似重复事实的名次。

0.0表示不去重。

只在相关性检索开启时使用。

#### 5、队列组字段

debounce_seconds是防抖等待秒数。

默认30，范围1到300。

排队更新要等多久才被处理。

queue_max_depth是待处理项的背压上限。

默认1000，0表示不限。

达到上限时新的非信号更新被拒绝（抛QueueFull）。

信号更新总是被放行。

重要的记忆永远不会被丢掉。

#### 6、事实容量组字段

max_facts是存储事实数上限。

默认100，范围10到500。

fact_eviction_policy是容量驱逐策略。

是一个Literal枚举，取值"confidence"或"hybrid-v1"。

默认"confidence"。

"confidence"保留历史行为。

"hybrid-v1"是可选项。

hybrid-v1综合置信度、显式确认新鲜度、查询驱动的访问热度。

hybrid-v1还带有限的纠错保留槽位。

fact_eviction_shadow_enabled是布尔值，默认False。

True时在confidence策略的裁剪中同时计算hybrid-v1。

把两者的分歧写进仅元数据的驱逐审计。

然后是六个驱逐参数。

eviction_confidence_weight默认0.65。

eviction_confirmation_weight默认0.25。

eviction_access_weight默认0.10。

三个权重的和必须等于1.0。

校验器会强制检查。

eviction_confirmation_half_life_days是确认新鲜度的半衰期天数。

默认90，范围1到3650。

eviction_access_half_life_days是访问热度的半衰期天数。

默认30，范围1到3650。

eviction_correction_reserved_fraction是纠错保留槽位的比例。

默认0.10，范围0.0到1.0。

eviction_correction_reserved_max是纠错保留槽位的绝对上限。

默认10，范围0到100。

eviction_audit_max_entries是每个user/agent作用域的驱逐审计事件上限。

默认200，范围0到10000。

0关闭审计。

审计只记元数据。

fact_confidence_threshold是存储事实的最低置信度。

默认0.7，范围0.0到1.0。

#### 7、注入组字段

max_injection_tokens是记忆注入的最大token数。

默认2000，范围100到8000。

token_counting是token计数策略。

Literal枚举，取值"tiktoken"或"char"。

默认"tiktoken"。

tiktoken准确但首次使用可能下载BPE数据。

char是免网络的CJK感知估算。

guaranteed_categories是保证注入的事实类别。

默认值是["correction"]。

这些类别不受常规token预算影响，总是注入。

guaranteed_token_budget是保证类别事实的token上限。

默认500，范围50到2000。

#### 8、过期审查组字段

staleness_review_enabled是布尔值，默认True。

老事实的过期审查开关。

staleness_age_days是老事实的年龄门槛。

默认90，范围30到365。

超过这个天数的事实成为审查候选。

staleness_min_candidates是触发一轮审查所需的最少候选数。

默认3，范围1到50。

staleness_max_removals_per_cycle是每轮审查最多能删几个事实。

默认10，范围1到50。

staleness_protected_categories是免于过期审查的类别。

默认值是["correction"]。

staleness_max_lifetime_multiplier是创建期的寿命上限乘数。

默认20.0，范围1.0到100.0。

新事实存储时LLM会指定expected_valid_days。

这个值被钳制到staleness_age_days乘以本乘数。

默认90乘20等于1800天，约5年。

这个默认足够宽裕。

"非常稳定"提示层的事实（核心技能、母语）不需要多轮审查就能撑过上限。

设计意图是防止模型一次就把初始寿命设得过长。

寿命过长会导致事实永远不被重新评估。

延长寿命走另一个参数。

staleness_max_extension_days是延长后的绝对上限天数。

默认3650，范围90到36500。

过期审查在写入时应用这个上限。

计算公式是min(days_since+extend_by,本上限)。

它和创建期乘数分开。

因为延长是刻意的重新校准决定。

不受staleness_age_days的尺度约束。

上限防止单个LLM误判永久推迟一个事实。

上限也防止下次候选选择时timedelta溢出。

#### 9、记忆合并组字段

consolidation_enabled是布尔值，默认False。

合并功能开关。

开启时LLM在正常的记忆更新调用里审查碎片化的类别。

是同一次调用，不额外请求API。

LLM决定相关事实组能否合成一个更丰富的事实。

默认False有一个明确理由。

合并是有损的。

源内容不保留，只保留consolidatedFrom的ID列表。

等记忆文件备份和审计方案就位后再显式开启。

consolidation_min_facts是单个类别触发审查的最少事实数。

默认8，范围3到30。

低于阈值就不值得把这一组交给LLM。

consolidation_max_groups_per_cycle是每轮更新最多合并几组。

默认3，范围1到10。

防止过度合并。

consolidation_max_sources是每组最多几个源事实。

默认8，范围2到20。

防止LLM把太多事实合并进一个而丢掉重要细节。

#### 10、可观测与判官字段

extraction_callback是一个可选回调。

类型是Any，默认None。

形式是callback(metrics)。

在提取LLM调用之后被调用。

指标包括token用量、通过和被置信度过滤拒绝的事实数、拒绝率、提示词版本。

宿主注入一个基于Langfuse的回调来产出提取span。

None表示没有调用后观测。

这个字段只能编程设置，不能从YAML来。

judge是可选的宿主注入记忆判官。

类型是Any，默认None。

形式是judge(context)->MemoryBatchVerdict。

判官做两件事。

判官决定这批对话值不值得一次提取调用（预筛）。

判官提供模型提示标签（信号分类）。

None时完全不做判官。

提取路径和没有这个功能的部署逐字节一致。

只能由宿主工厂编程设置。

判官通过MemoryManager.refresh_judge支持热重载。

#### 11、水位线缓存字段

watermark_max_keys是内存里对话水位线缓存的软上限。

默认4096，0表示不限。

缓存按每个不同的thread/user/agent存一个条目。

缓存是有界LRU。

超容量时最久未使用的条目被丢弃。

被丢弃的key在该线程下一轮会重新提取一批。

行为等同于一次重启。

#### 12、消息处理资源字段

patterns_dir是信号检测模式目录。

类型是str|None，默认None。

目录里放correction.yaml和reinforcement.yaml。

显式设置时覆盖内置的core/message_patterns/。

显式设置时两个文件必须都存在。

None时用内置默认。

prompts_dir是自定义提取提示词模板目录。

类型是str|None，默认None。

目录里放memory_update.chat.yaml、staleness_review.yaml、consolidation.yaml、fact_extraction.yaml。

None时用内置的core/prompts/。

#### 13、LLM与宿主钩子字段

model是嵌套的DeerMemModelConfig。

默认工厂生成一个空配置。

空配置表示零配置UX。

宿主工厂把默认聊天模型注入为host_llm。

这镜像重构前的model_name为None时用应用默认模型。

host_llm也不存在时（独立DeerMem）更新会抛异常。

但非LLM操作仍然工作。

然后是三个宿主钩子字段。

这三个都是可选的宿主注入可调用对象。

None表示用DeerMem默认。

should_keep_hidden_message形式是hook(additional_kwargs)->bool。

设置了它时hide_from_ui消息在它返回True时被保留。

None时跳过所有hide_from_ui消息。

这是与宿主无关的安全默认。

只能编程设置。

host_llm是宿主注入的预构建聊天模型。

用于记忆提取的零配置UX。

deer-flow工厂在model为空时把默认模型注入到这里。

优先级高于build_llm(model)。

None时从model构建（或model也为空时就没有LLM）。

只能编程设置，实例不能从YAML来。

trace_context_manager形式是cm(trace_id)。

这个可调用对象把trace_id绑定进宿主的请求追踪ContextVar。

绑定发生在记忆更新worker线程上（Timer或executor）。

这样结构化日志能关联trace。

None时不绑定。

独立DeerMem下trace_id仍然到达on_memory_llm_callback和日志文本。

只能编程设置。

追踪本身不走DeerMemConfig。

追踪走基类MemoryManager的callbacks字段。

LLM调用前触发on_memory_llm_call。

### （四）主要成员：_check_storage_path_is_directory校验器

这是DeerMemConfig上的model_validator，mode="after"。

校验器做两件事。

#### 1、storage_path必须是目录

第一件事是检查storage_path。

背景是DeerMem把storage_path当作根目录。

每个用户记忆在{storage_path}/users/{uid}/memory.json。

旧语义曾把storage_path当作文件路径。

一个残留的.json文件路径会造成严重后果。

FileMemoryStorage.save会调用mkdir(parents=True)。

对一个文件路径做mkdir会抛NotADirectoryError。

NotADirectoryError被当作OSError捕获。

结果是静默写失败。

记忆是持久状态。

错误的根目录是数据完整性大坑。

所以校验器在构造时就大声失败。

具体检查逻辑。

storage_path非空时用Path解析。

解析结果是一个已存在的文件时抛ValueError。

storage_path为空时允许通过。

空路径表示零配置，宿主会注入目录。

这个校验放在这里而不是宿主工厂。

这样即使独立构造或绕过工厂构建DeerMem，校验也会触发。

#### 2、驱逐权重和必须等于1.0

第二件事是检查三个驱逐权重。

eviction_confidence_weight加eviction_confirmation_weight加eviction_access_weight。

用math.isclose比较总和是否等于1.0。

绝对容差是1e-9。

不等于1.0时抛ValueError。

这保证混合驱逐的打分是规范化的。

### （五）主要成员：from_backend_config类方法

这是dict到配置的解析入口。

参数是backend_config，类型dict|None。

#### 1、空输入处理

backend_config为空时直接返回cls()。

所有字段用默认值。

零配置运行。

#### 2、未知键处理

模型字段里不存在的键被忽略。

忽略是向前兼容设计。

但会记一条WARNING日志。

为什么要记日志。

一个拼写错误（例如storage_pat少了个h）会静默退回默认值。

记忆会被写到意料之外的位置。

WARNING日志让拼写错误能被发现。

这镜像宿主层load_memory_config_from_dict的警告行为。

#### 3、None值处理

值等于None的键被丢弃。

丢弃后这些键退回字段默认值。

为什么要丢弃。

YAML渲染一个空键时会给出None。

例如config.example.yaml里model:下面只有被注释掉的子项。

None会被非Optional字段拒绝。

model字段是DeerMemModelConfig类型。

直接传None会校验失败。

但完全省略这个键是合法的。

所以丢弃None值就能让两种写法都工作。

### （六）它和谁协作

#### 1、它依赖谁

依赖pydantic的BaseModel、Field、model_validator。

依赖标准库logging、math、pathlib.Path。

不依赖DeerMem的其他模块。

DeerMemModelConfig被core/llm.py的build_llm消费。

#### 2、谁消费它

deer_mem.py的DeerMem是主要消费者。

DeerMem.model_post_init调用DeerMemConfig.from_backend_config。

DeerMem把解析结果存在_config私有属性上。

DeerMem从_config读取全部行为参数。

DeerMem再把_config传给MemoryUpdater和MemoryUpdateQueue。

updater和queue共享同一个_config实例。

这个共享是refresh_judge热重载生效的前提。

create_storage也接收DeerMemConfig。

自定义检索工厂会接到DeerMemConfig。

#### 3、宿主钩子的注入路径

四个钩子字段（extraction_callback、judge、should_keep_hidden_message、trace_context_manager）由from_config工厂以kwargs注入。

host_llm由宿主的host_llm_factory注入。

这些钩子都不从YAML来。

可观测性和实例类型的钩子只能编程设置。

#### 4、和共享配置的关系

共享的MemoryConfig在deerflow/config/memory_config.py。

共享配置只管enabled、injection_enabled、manager_class、backend_config。

backend_config这个dict由本模块的DeerMemConfig解析。

两层职责分离。

宿主层的开关留在宿主层。

DeerMem私有的调优参数留在本模块。

## 十、重要性评级

评级是8分。

理由如下。

这个模块是DeerMem全部行为的控制面。

存储位置、LLM选择、队列背压、容量驱逐、注入预算、过期审查、合并、检索策略。

每一项都由这里的字段决定。

改任何一个字段都会直接改变记忆系统的运行行为。

这个模块有几个高价值的安全设计。

storage_path的目录校验防止静默写失败。

驱逐权重和校验防止打分失范。

未知键的WARNING防止拼写错误写丢记忆。

None值丢弃让YAML空键写法不炸。

这些设计都直接保护持久化数据的完整性。

这个模块是配置迁移的兼容层。

字段名镜像旧MemoryConfig私有字段。

迁移对用户是一次纯粹的路径变化。

扣掉2分的理由。

这个模块本身不含行为逻辑。

所有字段只是声明和约束。

真正消费字段并执行行为的是DeerMem和五个core模块。

字段描述虽长但多为静态说明。

理解配置离不开理解消费者。
