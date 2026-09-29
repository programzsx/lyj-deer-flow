# deerflow.agents.memory.backends.deermem.deermem.core-档案

## 一、这个包是干什么的

这个包是DeerMem的"功能核心"包。

包名是`deerflow.agents.memory.backends.deermem.deermem.core`。源码在`backend/packages/harness/deerflow/agents/memory/backends/deermem/deermem/core/`。

大白话讲。记忆后端要干五件事。存记忆。排队。更新记忆。写提示词。处理消息。这个包把这五件事的实现全部装在一起。

这个包是整个记忆子系统里最大的包。它的代码量很大。仅`storage.py`、`updater.py`、`prompt.py`三个文件合计就接近30万字节。

这个包的`__init__.py`只有一段声明。它声明五个功能模块。内部模块通过`deerflow.agents.memory.backends.deermem.deermem.core.<module>`互相导入。

这个包是DeerMem的"工作车间"。外层只做组装和契约翻译。车间里的活全在这里干。

## 二、包里的主要成员

### 1、storage.py

这个模块是存储提供者。约9.4万字节。

- `MemoryStorage`。存储抽象基类。
- `FileMemoryStorage`。文件存储实现。
- `create_empty_memory()`。空记忆结构。
- `normalize_memory_data()`。数据规范化。
- `MemoryStorageCorruption`、`MemoryRevisionConflict`。存储错误。
- `RetrievalPort`。检索端口协议。
- `_atomic_write()`、`_process_file_lock()`。原子写与文件锁。

存储契约很明确。文件后端只把项目无关的用户/历史摘要存进一个用户级`memory.json`。每个事实用规范Markdown文件存在必需的agent名下。`memory.json`永远不存事实或事实索引。

公开的`load`/`save`兼容面仍暴露历史文档形状。这样updater和Gateway调用方可以渐进迁移到事实仓库API。

### 2、queue.py

这个模块是带防抖的记忆更新队列。约2.1万字节。

- `MemoryUpdateQueue`。队列本体。
- `ConversationContext`。一条排队上下文。
- `QueueFull`。队列满异常。
- `queue_key()`。队列键。

设计要点。队列收集对话上下文。可配置的防抖期之后处理它们。同一个`(thread_id, user_id, agent_name)`键的多个上下文合并成一次更新。

队列是进程内列表加防抖Timer。进程退出时还没处理的条目会丢失。优雅关闭的`flush_sync`可以缓解。

记忆更新是尽力而为。失败或丢失的更新会在下一轮对话重新喂入。中间件每轮传完整对话。更新器的水位线在失败时不前进。所以内存队列就够用，不需要持久层。

### 3、updater.py

这个模块是记忆更新器。约13.4万字节，是最大的文件。

它负责读、写、更新记忆数据。

- `MemoryUpdater`。更新器本体。解析LLM响应、规范化更新数据、去重、应用更新。
- `_parse_memory_update_response()`。解析LLM的记忆更新响应。
- `_normalize_memory_update_data()`。规范化更新数据。
- `_find_dedup_merge_target()`。找去重合并目标。
- `_select_stale_candidates()`、`_build_staleness_section()`。过期事实审查。
- `_select_consolidation_candidates()`、`_build_consolidation_section()`。记忆合并。
- `_strip_upload_mentions_from_memory()`。去掉记忆里的上传提及。

### 4、prompt.py

这个模块是提示词模板。约3.9万字节。

- `load_prompt()`。加载记忆更新提示词。
- `load_prompt_messages()`。加载消息形式的提示词。
- `format_memory_for_injection()`。把记忆格式化成注入文本。这是注入路径的核心函数。
- `format_conversation_for_update()`。把对话格式化成更新输入。
- `PromptConfigurationError`。提示词配置错误。
- `_count_tokens()`、`warm_tiktoken_cache()`。令牌计数。

注入格式化会按相关性排序事实。按类别分组。保证某些类别出现。截断到令牌上限。

### 5、message_processing.py

这个模块把对话变成记忆更新输入。约1.5万字节。

- `load_patterns()`。从YAML文件加载信号模式。`correction`或`reinforcement`。
- `detect_signals()`。检测信号。
- `filter_messages_for_memory()`。过滤要记忆的消息。
- `filter_trivial()`。过滤琐碎消息。
- `SIGNAL_NAMES`。信号名清单。

信号模式外置在`core/message_patterns/`目录。七个YAML文件。correction、decision、goal、identity、preference、reinforcement、trivial。

### 6、retrieval.py

这个模块是FTS5检索引擎。约2.8万字节。

- `FTS5Retrieval`。低层SQLite引擎。
- `FTS5RetrievalAdapter`。存储集成适配器。实现`storage.RetrievalPort`。
- `create_fts5_retrieval()`。工厂。

提供BM25全文搜索。支持jieba中文分词（可选，回退到空白分词）。支持FTS5的AND/OR/NOT/短语/前缀语法和回退。支持时间衰减加置信度加权排序。支持类别过滤。支持用户隔离。

适配器不导入storage模块。这样避免循环依赖。

### 7、relevance.py

这个模块是确定性词法相关性排序。纯Python，不联网。

- `lexical_relevance()`。idf加权的查询与事实内容重叠。
- `score_facts()`、`rank_facts()`。词法相关性加事实置信度组合排序。
- `diversify()`。贪心MMR选择。降低近似重复事实的排名。

### 8、eviction.py

这个模块是确定性的、可解释的容量策略。约7.8千字节。

- `EVICTION_POLICY_CONFIDENCE`、`EVICTION_POLICY_HYBRID_V1`。两个策略名。
- `select_facts_for_capacity()`。容量限制下选择要淘汰的事实。
- `FactEvictionScore`、`EvictedFact`。评分与淘汰记录。

### 9、paths.py

这个模块是DeerMem自己的路径解析。不导入宿主的路径助手。

根目录等于`config.storage_path`（如果设了）或`$DEERMEM_DATA_DIR`或`~/.deermem/`。每个用户有一个全局`memory.json`。agent专属事实住在`agents/{agent_name}/facts`下。

user_id在进程内清洗。agent_name用内联模式校验。DeerMem不导入宿主的`make_safe_user_id`。

### 10、llm.py

这个模块是DeerMem自己的LLM构建。不导入宿主的`create_chat_model`。

`build_llm(model_config)`用`langchain.chat_models.init_chat_model`从模型子配置构建ChatModel。任何langchain支持的provider都行。

### 11、markdown_storage.py与markdown_format.py

这两个模块是可选的Markdown感知摘要存储。

默认`FileMemoryStorage`把用户记忆摘要存成一个JSON文档。推理模型偶尔输出坏JSON。历史上部分写入的摘要会抛`MemoryStorageCorruption`并拖垮整个智能体。

`MarkdownMemoryStorage`磁盘上还是JSON，但加载器是宽容的。坏文件不再崩溃。Markdown摘要只通过围栏的`memory-json`代码块接受。不可读文件先隔离成`memory.json.corrupt-<timestamp>`再返回None。隔离让内容可恢复。

## 三、它和谁协作

### 1、上游

内层`deermem`包（`deer_mem.py`）是它的唯一组装者。`model_post_init`把storage、patterns、llm、updater、queue组装成一个DeerMem实例。

### 2、内部协作

模块之间有清晰的依赖方向。

- `updater.py`用`eviction.py`、`message_processing.py`、`config.py`。
- `prompt.py`用`relevance.py`。
- `storage.py`定义`RetrievalPort`协议。`retrieval.py`的适配器实现这个协议。适配器不导入storage。这样避免循环依赖。
- `queue.py`持有`updater`。防抖到期后调用更新器。

### 3、数据流

一次完整记忆更新的路径是：

消息先到`message_processing.py`过滤。过滤后的文本进`queue.py`排队。防抖到期后`updater.py`调LLM解析更新。更新通过`storage.py`落盘。读取时`prompt.py`格式化。搜索时`retrieval.py`和`relevance.py`排序。

### 4、测试

这个包的测试很密集。`test_memory_updater.py`、`test_memory_queue.py`、`test_memory_queue_user_isolation.py`、`test_memory_eviction.py`、`test_memory_fact_dedup.py`、`test_memory_storage.py`、`test_memory_prompt_injection.py`、`test_memory_consolidation.py`等。

还有基准测试。`scripts/benchmark/deermem_eviction/`评测生产环境的`select_facts_for_capacity()`实现。

## 四、重要性评级

评级是7分。

理由如下。

这个包是默认记忆后端的全部实质实现。代码量占整个记忆子系统的大头。

它的设计质量很高。每个模块的文档字符串都写清了设计原因。错误翻译、防抖重喂、宽容加载、原子写入，都是真实故障沉淀出的设计。

它被引用的方式单一。只有外层壳导入它。这是刻意的封装。

删除它会怎样。DeerMem后端彻底瘫痪。记忆的存、取、搜、更新全部失效。

为什么是7分。它属于记忆这条可选能力线。记忆不是智能体的存活必需。换后端可以绕开它。

为什么不是更低分。它是默认后端的默认实现。默认配置下全系统的记忆行为都由它支撑。它的正确性直接决定记忆数据的完整性。
