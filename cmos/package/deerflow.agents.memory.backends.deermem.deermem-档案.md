# deerflow.agents.memory.backends.deermem.deermem-档案

## 一、这个包是干什么的

这个包是DeerMem后端的"内层实现"包。

包名是`deerflow.agents.memory.backends.deermem.deermem`。源码在`backend/packages/harness/deerflow/agents/memory/backends/deermem/deermem/`。

名字里有两层deermem。外层是后端包。内层是实现包。

大白话讲。外层`deermem`包是"对外的壳"。壳里只装管理器类和契约声明。内层`deermem`包是"里子"。里子装真正的配置对象和功能核心。

这个包的`__init__.py`是空文件。空文件表示这是一个普通包。

这个包只装两个成员。配置模块和功能核心目录。

DeerMem的全部私有逻辑都藏在里面。外层壳和共享契约层都不碰这些逻辑。

## 二、包里的主要成员

### 1、config.py

这个模块定义DeerMem私有配置。

- `DeerMemConfig`。主配置类。pydantic`BaseModel`。
- `DeerMemModelConfig`。嵌套的模型子配置。

设计要点写在文档字符串里。

DeerMem私有配置住在这里，不在共享的`MemoryConfig`上。共享配置只带宿主共享字段：`enabled`/`injection_enabled`/`manager_class`/`backend_config`。

工厂把`backend_config`（一个dict）传给`DeerMem.__init__`。`__init__`把它解析成`DeerMemConfig`。

字段名镜像抽象化之前的`MemoryConfig`私有字段。这样迁移是一次纯移动。config.yaml的`memory.<field>`变成`memory.backend_config.<field>`。

默认值让DeerMem在零配置下运行。

配置分几大类。

#### （1）模型配置

`DeerMemModelConfig`有五个字段。`provider`、`model`、`api_key`、`base_url`、`temperature`。`model`为None表示没配LLM。非LLM操作仍然工作。更新操作会抛错。

#### （2）存储配置

`storage_path`决定数据根。`storage_class`决定存储提供者。`manifest_filename`、`file_lock_timeout_seconds`、`strict_user_scope`控制存储细节。

#### （3）队列配置

`debounce_seconds`控制防抖。`queue_max_depth`控制队列深度。

#### （4）容量淘汰配置

`max_facts`限制事实总数。`fact_eviction_policy`选策略。`eviction_confidence_weight`等字段配置各因素权重。

#### （5）检索配置

`retrieval_adapter`选检索适配器。`retrieval_relevance_enabled`等字段控制相关性排序。

#### （6）注入配置

`max_injection_tokens`限制注入大小。`token_counting`选计数方式。`guaranteed_categories`和`guaranteed_token_budget`保证某些类别出现在注入里。

#### （7）过期审查配置

`staleness_review_enabled`及一组字段控制过期事实的审查和移除。

### 2、core/目录

功能核心目录。它有自己的档案文档。这里简述。

`core/`的`__init__.py`声明五个功能模块。内部模块通过`deerflow.agents.memory.backends.deermem.deermem.core.<module>`互相导入。

五个功能模块是：

- `storage.py`。存储。文件后端把项目无关的用户/历史摘要存进一个用户级`memory.json`。每个事实用规范Markdown文件存在agent名下。
- `queue.py`。队列。带防抖机制的记忆更新队列。同一个`(thread_id, user_id, agent_name)`键的多个上下文合并成一次更新。
- `updater.py`。更新器。读取、写入、更新记忆数据。解析LLM响应、去重、过期审查、合并。
- `prompt.py`。提示词模板。记忆更新与注入的模板。
- `message_processing.py`。消息处理。把对话变成记忆更新输入的共享助手。

还有辅助模块：

- `retrieval.py`。FTS5检索引擎。BM25全文搜索。
- `relevance.py`。确定性词法相关性排序。
- `eviction.py`。确定性的容量淘汰策略。
- `paths.py`。DeerMem自己的路径解析。
- `llm.py`。DeerMem自己的LLM构建。
- `markdown_storage.py`、`markdown_format.py`。可选的Markdown感知摘要存储。

## 三、它和谁协作

### 1、上游

外层`deermem`包是它的唯一上游。`deer_mem.py`导入这里的`DeerMemConfig`和全部core模块。

`model_post_init`里用`DeerMemConfig.from_backend_config()`解析配置。用`create_storage()`建存储。用`load_patterns()`载入信号模式。用`build_llm()`建LLM。用`MemoryUpdater`组装更新器。用`MemoryUpdateQueue`组装队列。

### 2、协作方式

配置对象`self._config`被外层管理器、更新器、队列三方共享。热重载判定器时改一处配置就够。不用重建存储、LLM或队列。

### 3、下游依赖

它几乎不依赖宿主。

它依赖pydantic做配置。依赖yaml读模式文件和提示词模板。依赖langchain的消息类型。`updater.py`和`prompt.py`用tiktoken计数令牌。

它不导入deer-flow的路径助手、配置单例或模型工厂。`paths.py`自带路径解析。`llm.py`自带LLM构建。

### 4、测试

`test_memory_updater.py`、`test_memory_queue.py`、`test_memory_eviction.py`、`test_memory_storage.py`、`test_memory_prompt_injection.py`、`test_memory_normalize.py`等测试覆盖这个包。

## 四、重要性评级

评级是7分。

理由如下。

这个包是DeerMem后端的"发动机"。配置、存储、队列、更新、提示词全部在这里。

DeerMem是默认记忆后端。这个包实际支撑着默认配置下的全部记忆行为。

它被引用的方式很集中。只有外层`deer_mem.py`导入它。这是刻意的封装。

删除它会怎样。DeerMem后端立即瘫痪。配置对象没了。存储、队列、更新器全没了。默认记忆功能失效。

为什么是7分。它属于记忆这条可选能力线。记忆可以整体关闭或换后端。而且它被良好封装，只有外层壳依赖它。

为什么不是更低分。它是DeerMem的全部实质内容。外层壳只有几十行。没有这个包，deermem后端就是一个空名字。
