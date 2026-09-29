# updater.py 档案

模块全名是deerflow.agents.memory.backends.deermem.deermem.core.updater。

源文件位置是backend/packages/harness/deerflow/agents/memory/backends/deermem/deermem/core/updater.py。

文件有2617行。

## 一、这个模块是干什么的

这个模块是记忆更新器。

它用LLM从对话里提取、写入、更新记忆。

它是整个记忆系统里最大的模块。

它的职责分几块。

第一块是记忆提取。从对话消息里用LLM提取新事实、总结更新、矛盾删除。

第二块是事实CRUD。创建、删除、更新单个事实。

第三块是导入和清空。导入外部记忆数据、清空记忆。

第四块是容量控制。事实太多时按策略淘汰。

第五块是维护审查。过期审阅和合并整理的落地。

第六块是提取安全。用范围门挡住不该存的东西。

## 二、模块级辅助函数

（一）LLM响应的解析

_extract_text从LLM响应content里提取纯文本。

现代LLM可能返回结构化的content块列表。

直接用str()会产出Python repr而不是文本。

字符串块无缝拼接。

避免破坏分块的JSON载荷。

字典块用换行拼接。

_parse_memory_update_response从LLM响应里解析第一个合法的记忆更新JSON对象。

有些供应商会把JSON包进思考痕迹、散文或Markdown围栏。

解析器接受可安全提取的JSON对象。

不修复截断的或坏掉的JSON。

必须有user、history、newFacts三个顶层键才算合法。

（二）归一化函数

_normalize_memory_update_data把解析后的数据变成_apply_updates消费的形状。

它处理七类操作。

- newFacts，新事实。
- factsToReinforce，要确认的事实。
- factsToRemove，矛盾删除。
- staleFactsToRemove，过期删除。
- staleFactsToExtend，过期延期。
- factsToConsolidate，合并整理决定。

一个关键的安全设计。

factsToRemove存在且newFacts有坏项时抛JSONDecodeError。

这是"不安全的部分更新"。

LLM输出坏掉的部分新事实时不能只应用删除。

删除是破坏性的。

_normalize_memory_update_fact归一化单条新事实。

布尔confidence拒绝。

非有限confidence拒绝。

scope、durability、authority三个分类字段是提取专有元数据。

它们穿过结构归一化，但永不进入持久化的事实。

（三）范围门函数

三个门函数返回确定性的拒绝原因。

_fact_scope_gate_reason检查新事实。

要求scope是user、durability是durable、authority是descriptive。

_summary_scope_gate_reason检查总结更新。

要求scope是user、authority是descriptive。

_removal_scope_gate_reason检查矛盾删除。

要求scope是user、reason非空。

提取给提案打上scope、durability、authority标签。

自动写入只接受用户作用域、持久、描述性的事实。

总结散文必须用户作用域且描述性。

缺标签拒绝该项。

拒绝该项但不停止无关的更新。

任务作用域和项目作用域的删除是fail closed的。

（四）上传提及的清洗

_UPLOAD_SENTENCE_RE匹配描述文件上传事件的句子。

匹配刻意窄。

窄是为了不删掉合法事实。

比如"User works with CSV files"或"prefers PDF export"。

_strip_upload_mentions_from_memory从所有总结和事实里删掉上传事件的句子。

上传的文件是会话作用域的。

把上传事件持久化到长期记忆会让代理在未来的会话里搜索不存在的文件。

（五）重复检测

_fact_content_key生成内容的规范化键。

casefold处理。

_raise_if_duplicate_fact_content拒绝内容已存在的候选事实。

调用方必须在读写临界区里对最新快照调用。

每次修订冲突重试都要调。

这样并发创建同样内容的两个写者不能都通过检查。

_fact_content_similarity是有界的token-Jaccard相似度。

_fact_content_tokens是确定性、无网络的分词。

拉丁词和CJK大词元在混合文本里共存。

空格分隔的中文串保留相邻字符顺序。

_find_dedup_merge_target返回同类别里最相似且达到阈值的事实。

这是写入侧近重复门（issue #5252）。

（六）过期审阅辅助

_read_expected_valid_days读取事实的expected_valid_days。

拒绝布尔。

要求有限。

先转int再检查正数。

巨大整数原样返回而不是过float()。

float()对10的400次方会抛OverflowError。

_safe_add_days计算加天数，溢出返回None。

_select_stale_candidates选出超过个体审阅窗口的事实。

有合法lastConfirmedAt的重置审阅时钟。

lastConfirmedAt是明确的事实仍为真的证据。

否则用createdAt。

受保护类别（默认correction）被排除。

correction代表明确的用户反馈。

不应按年龄自动清除。

（七）合并整理辅助

_select_consolidation_candidates返回超过碎片阈值的类别。

按类别分组。

只返回至少consolidation_min_facts个的类别。

staleness_protected_categories里的类别豁免。

明确的用户反馈永远不被提出合并。

（八）转义辅助

_escape_memory_for_prompt返回memory的深拷贝。

每个字符串叶子都html转义。

memory_update提示把完整记忆状态作为json.dumps的blob嵌进current_memory块。

json.dumps转义引号和反斜杠。

但保留<、>、&原样。

用户影响的字段里的</current_memory><evil>能突破块。

prompt注入由此防住（#4044）。

_memory_with_manual_markers给手动事实加[MANUAL]前缀。

[MANUAL]是提示专有信号。

告诉提取LLM这个事实是高信任的用户编辑。

持久化记忆不受影响。

幂等。

（九）_message_identity函数

_message_identity返回消息的可哈希身份。

水位线按身份追踪。

不是按索引。

身份按内容还是索引的设计理由是总结化会删除对话头部。

索引水位线在头部删除后指向错误的消息。

会静默跳过未提取的轮次。

优先用langchain消息id。

没有id时回退到(type, content)。

既无id也无文本时返回None。

调用方此时喂全量列表。

过提取是安全的，从不丢数据。

## 三、MemoryUpdater类

（一）构造

MemoryUpdater接受注入的config、storage、llm。

prompts_dir是可选的自定义提示目录。

callbacks是可选的MemoryCallbacks。

on_memory_llm_call在LLM调用前合并追踪元数据。

None时无追踪。

（二）水位线

水位线是每个(thread_id, user_id, agent_name)键的"最后已提取消息身份"。

存在内存里。

重启后重新提取一批。

缓存是有界的LRU。

上限是config.watermark_max_keys。

长寿的Gateway处理很多线程时不会无限增长。

丢掉的键在该线程下一轮重新提取一批。

0表示不设上限。

_watermark_get读水位线并标记最近使用。

用键存在性判断，不是值的真假。

存储的None身份也算活的LRU条目。

_watermark_set存值并按LRU上限淘汰。

_feed_after_watermark返回未提取的消息切片。

水位线消息还在时，喂它之后的部分。

水位线消息不在时，喂全量列表。

重新喂是安全的过提取。

过提取从不跳轮次。

跳轮次才是会丢事实的失败方向。

（三）update_memory和aupdate_memory

update_memory同步更新记忆。

从运行中的事件循环里调用时，阻塞的同步调用被offload到线程池。

线程池是模块级的_SYNC_MEMORY_UPDATER_EXECUTOR。

4个工作线程。

线程池的关键设计是它跑同步的model.invoke调用。

不创建事件循环。

langchain的异步httpx客户端池（全局lru_cache缓存）永远不会被碰。

跨循环连接复用不可能发生。

这消除了issue #2615描述的跨循环连接复用bug。

aupdate_memory用asyncio.to_thread委托到同步路径。

同一个理由。

（四）主流程_do_update_memory_sync_impl

这是提取的核心流程。

流程如下。

第一步算水位线键。

bypass_watermark时喂全量。

否则喂水位线之后的部分。

没有新消息时直接返回True。

第二步在post-watermark的喂入上重新检测信号。

提取提示只引用LLM真正看到的轮次。

入队时的signals已经服务于背压。

第三步检测整批信号（window=None）。

judge的L3否决读整批。

因为跳过会消费所有喂入的轮次并推进水位线。

批次里任何位置出现明确信号都必须让它免于judging。

第四步格式化批次文本。

第五步问注入的memory judge。

judge是宿主注入的钩子。

None时或judge=False（关机排水）时不问。

judge失败记日志按"无意见"处理。

预筛选永远不能丢记忆。

信号分类永远不能挡记忆。

第六步处理verdict。

verdict.skip为True时消费批次并推进水位线。

不跑提示、不调LLM、不应用。

推进让省下调用变成真的。

第七步准备提示。

提示的信号提示取确定性集合并上模型提示的并集。

但强化证据门只读确定性集合。

模型verdict永远不能确认一个事实。

第八步调LLM。

调前合并追踪元数据。

调后通知结果钩子。

第九步_finalize_update应用更新并持久化。

第十步成功且非紧急路径时推进水位线。

finally块发提取指标。

attempted时才发。

失败时弹掉mutations_accepted。

失败的提取没有持久化任何东西。

apply点的计数器不该发布。

评估脚本把出现的计数器当结果。

缺席加失败是删失的。

这是诚实的读法。

（五）_finalize_update方法

_finalize_parse解析模型响应、应用更新、持久化。

支持repository的apply_changes路径和legacy的save路径。

apply_changes路径上最多重试3次。

每次冲突后从磁盘重新加载最新快照。

快照级的trim、合并、删除决定必须重放到完整的新文档。

永不作为不交叠的点写入重放。

深拷贝在原地修改前做。

失败的提交不能弄脏缓存的快照。

（六）_apply_updates方法

这是把LLM生成的更新应用到记忆的核心。

它的步骤如下。

第一步确认强化。

只有policy是hybrid-v1或影子开启时才处理。

强化IDs必须有user scope、非空reason、id存在。

确认设置lastConfirmedAt和confirmationCount。

第二步应用user节的总结更新。

第三步应用history节的总结更新。

每节都要过总结范围门。

第四步处理过期审阅的删除和延期。

确定性护栏和实际的过期候选相交。

LLM滑出一刀发出受保护类别或未过期的id时被静默拒绝。

每周期删除有上限。

超过上限时保留confidence最低的。

被提议删除的事实永远不被延期。

包括上限保住的事实。

延期的新窗口是min(天数加extend_by_days, staleness_max_extension_days)。

延期用绝对上限而不是创建时的乘数上限。

延期是故意的审阅决定。

第五步添加新事实。

两个独立的接受过滤器。

一个是确定性范围门。

一个是confidence阈值。

每个在自己的过滤点计数。

范围门拒绝的和阈值以下的都跳过。

内容键已存在的跳过。

这是内容级重复检查。

近重复合并（fact_dedup_enabled开启时）。

提议的新事实和已有同类事实相似度达到阈值时合并进已有事实。

已有事实的id、content、createdAt保持权威。

confidence提升到最大值。

source只在confidence提升时刷新。

配对的替换提议绕过近去重。

配对的替换内容要保留给容量后的替换检查。

任何被提议删除的id都不是合并目标。

即使删除护栏或上限保住了它。

每个新事实的expected_valid_days有创建时上限。

上限是staleness_age_days乘staleness_max_lifetime_multiplier。

第六步强制一个容量策略。

自动、手动、导入的写入都走_select_for_capacity。

使用量来自单独的侧车。

打分不因为查询召回而重写规范时间戳。

第七步处理矛盾删除。

只有在替换过了两道门并活过去重和修剪后才删除。

任务本地的矛盾不能删用户记忆。

失败的配对替换不能退化成只删更新。

配对删除需要它的替换通过所有写门。

只统计真实存在的目标。

第八步处理合并整理。

在max_facts修剪之后运行。

刚被淘汰的源事实不在fact_index里。

存在性护栏拒绝它们。

防止唯一真正的数据丢失场景。

源被删了但合并结果自己又被修剪掉。

合并永远删至少2个事实加1个。

所以修剪后运行不会推过max_facts。

特性标志在应用时把关。

配置变化和防抖更新竞态时不静默合并。

源ID必须存在、不被消费、在允许集合里。

每组2到max_sources个。

confidence用LLM返回值但封顶在源最大值。

合并不能膨胀confidence。

低于存储阈值的合并跳过。

用最新源的createdAt。

staleness时钟反映底层信息的年龄。

用最早源的审阅期限。

合并组合每个源的细节。

易变的子细节不能继承稳定源的长期窗口。

## 四、容量控制

_select_for_capacity应用配置的策略。

事实不超过max_facts时不做任何事。

使用混合打分时从storage读使用量侧车。

影子模式记录不同意见但强制confidence选择。

策略是confidence时精确保留历史排序。

策略是hybrid-v1时组合三个有界信号。

_record_capacity_decision在规范持久化成功后写尽力而为的审计。

审计失败记警告。

## 五、提取指标

_emit_extraction_metrics调用提取后的可观测回调。

比如Langfuse span。

无回调时no-op。

回调异常记日志吞掉。

可观测性永远不破坏更新路径。

指标包括：

- facts_extracted，提取的事实数。
- facts_passed_confidence，过置信度阈值的数量。
- rejected_low_confidence，低置信度拒绝数。
- facts_passed_scope_gate，过范围门的数量。
- rejected_by_scope_gate，范围门拒绝总数。
- scope_gate_rejections，按类别和原因的拒绝计数。
- mutations_accepted，实际落地的变更数。
- facts_merged_dedup，近重复合并数。

mutations_accepted在实际的apply点计数。

接受的的新事实、接受的删除、接受的确认、接受的合并。

这是"值得记住"的定义。

唯一效果是总结重写的批次计零。

跳过丢弃它就不是丢记忆。

## 六、它和谁协作

（一）它依赖谁

它依赖eviction.py的容量策略。

它依赖message_processing.py的detect_signals和extract_message_text。

它依赖prompt.py的格式化和模板加载。

它依赖storage.py的MemoryStorage。

它依赖DeerMemConfig。

（二）谁调用它

queue.py的_process_queue对每个上下文调用update_memory。

DeerMem本体构造并持有它。

DeerMem把LLM和存储注入它。

summarization_hook通过队列走到它。

Gateway的记忆工具最终走它的fact CRUD。

（三）相关测试

聚焦的updater测试在backend/tests/test_memory_updater.py。

## 七、设计意图

这个模块体现四个设计。

第一个设计是提取安全。

范围门是确定性防线。

提取标签的scope、durability、authority决定接受。

缺标签拒绝。

任务作用域删除fail closed。

LLM滑刀被护栏挡住。

第二个设计是确定性优先。

确认门只读确定性信号集。

模型verdict永远不能确认事实。

模型提示只是提示。

近去重的相似度是无网络的token-Jaccard。

第三个设计是计数在真实位置。

每个指标在自己的过滤或应用点计数。

可观测性和实际接受永不漂移。

失败的提取不发布计数器。

删失是诚实的。

第四个设计是同步调用路径。

更新跑在worker线程。

用同步invoke。

不创建事件循环。

不碰异步httpx连接池。

跨循环复用bug由此消除。

## 重要性评级

评级是10分（满分10分）。

理由如下。

这个模块是记忆系统里最大的模块。

2617行。

它是记忆提取的核心。

所有被动记忆更新、手动工具写入、导入、清理都经过它。

它的安全设计密集。

范围门、fail closed、配对替换护栏、合并整理护栏、过期审阅护栏。

任何一道护栏失效都是用户数据丢失或污染。

它的计数纪律精细。

mutations_accepted在真实apply点计数。

这是预筛选评估的基础。

计数漂移会让评估读出错误的"丢失记忆"。

它处理LLM输出的所有畸形情况。

坏JSON、部分更新、布尔confidence、非有限值、巨大整数。

这些防御全是真实的边界情况。

它还承载了跨循环连接复用bug的修复。

AGENTS.md里updater相关的约束条款最多。

它是这个包里和storage.py并列的最高重要性模块。

评10分。
