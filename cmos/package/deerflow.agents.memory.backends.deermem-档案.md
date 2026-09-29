# deerflow.agents.memory.backends.deermem-档案

## 一、这个包是干什么的

这个包是DeerFlow的"默认记忆后端"包。

包名是`deerflow.agents.memory.backends.deermem`。源码在`backend/packages/harness/deerflow/agents/memory/backends/deermem/`。

说明一点。任务给的原路径`backend/packages/harness/de/backends/deermem`是笔误。实际位置就是上面这个。

大白话讲。记忆系统定义了"谁能存记忆"的契约。这个包是契约的默认实现。DeerFlow自己的记忆格式、自己的存储方式、自己的提取逻辑，全在这里。

这个包是自包含的。

包文档字符串写得很清楚。它有自己的管理器类（`deer_mem`模块）加一个`core/`文件夹。`core/`里有五个功能模块（storage/queue/updater/prompt/message_processing）。所有DeerMem私有逻辑都住在这里。

 DeerMem私有的东西故意不放进抽象基类。过滤与检测、`<memory>`包装、enabled门控、事实模型，全部留在这里。

## 二、包里的主要成员

### 1、__init__.py

它只做一件事。从`deer_mem`导入`DeerMem`，暴露`MANAGER_CLASS = DeerMem`。

`MANAGER_CLASS`被工厂的扫描机制发现。文件夹名`deermem`就是配置值。

### 2、deer_mem.py

这个模块是后端入口。`DeerMem`类继承`MemoryManager`。

`DeerMem`的定位是"文件后端事实加防抖LLM提取"。

- 私有依赖用`PrivateAttr`。`_config`、`_storage`、`_llm`、`_updater`、`_queue`。这些是非pydantic对象，不参与校验和序列化。`model_post_init`里从`backend_config`构建。
- `supports_search = True`。它实现search。所以它有效于mode="tool"。

核心方法：

- `from_config()`。构建并消费宿主钩子。宿主钩子（追踪、隐藏消息过滤器、追踪上下文管理器、宿主LLM工厂）作为kwargs传入。DeerMem合并自己消费的部分。构建后把`backend_config`恢复成宿主传的纯数据。这样字段保持可序列化，符合README契约。
- `add()`。写入入口。先过滤、校验、检测信号，然后进防抖队列。队列满了就记日志并丢弃。丢弃的更新下一轮对话会重新喂入。因为中间件每轮传完整对话，水位线在失败时不前进。
- `add_nowait()`。立即冲刷的写入。
- `get_context()`。读注入文本。格式化记忆加`<memory>`包装。
- `search()`。三种搜索方式。FTS5搜索、子串搜索、相关性搜索。
- `get_memory()`。取完整记忆。返回DeerMem形状字典。
- `create_fact()`、`update_fact()`、`delete_fact()`。事实CRUD。
- `warm()`、`warm_retrieval()`。启动预热。
- `shutdown_flush()`。优雅关闭时冲刷队列。
- `refresh_judge()`。宿主配置热重载后替换判定器。
- `_call_backend()`。把DeerMem私有存储错误翻译成公共契约错误。`MemoryRevisionConflict`变成`MemoryConflictError`。`MemoryStorageCorruption`变成`MemoryCorruptionError`。

### 3、deermem/内层子包

内层子包装配置和功能核心。

- `config.py`。`DeerMemConfig`。DeerMem私有配置。从`MemoryConfig.backend_config`解析。
- `core/`。功能核心。下一条详述。

#### （1）config.py的要点

配置字段很多。重要的有：

- `model`。嵌套的`DeerMemModelConfig`。记忆更新LLM的provider/model/api_key/base_url/temperature。
- `storage_path`。数据根。空值等于`$DEERMEM_DATA_DIR`或`~/.deermem/`。
- `storage_class`。可选的替代存储提供者。
- `debounce_seconds`、`queue_max_depth`。防抖与队列深度。
- `max_facts`。最大事实数。默认100。
- `fact_eviction_policy`。淘汰策略。`confidence`或`hybrid-v1`。
- `max_injection_tokens`。注入令牌上限。
- `staleness_review_enabled`。过期审查。
- `fact_dedup_enabled`。事实去重。

默认值让DeerMem在零`backend_config`下就能运行。

## 三、它和谁协作

### 1、上游

- `deerflow.agents.memory.manager`。契约与工厂。工厂发现`MANAGER_CLASS`并注入宿主钩子。
- `MemoryMiddleware`。调用`add()`做被动捕获。
- `memory_flush_hook`。摘要前调用`add_nowait()`。
- `lead_agent/prompt.py`。调用`get_context()`注入记忆文本。
- Gateway记忆路由。调用`get_memory()`、fact CRUD等。
- `memory_search`等工具。调用`search()`和fact CRUD。

### 2、下游

内层`deermem/deermem/core/`是它的工作引擎。它把五个功能模块组装起来。

它只从`deerflow`导入契约那一行。其他全部自包含。这是可移植性黄金法则的实践。

### 3、测试

`tests/test_memory_updater.py`、`test_memory_queue.py`、`test_memory_eviction.py`、`test_memory_fact_dedup.py`、`test_memory_prompt_injection.py`、`test_memory_storage.py`等大量测试覆盖这个包。

## 四、重要性评级

评级是8分。

理由如下。

这个包是默认记忆后端。不配置`manager_class`时，全系统的记忆都存它这里。

它是自包含设计的一个样板。可移植性黄金法则在这里被严格执行。

它被引用的地方很集中。中间件、提示词、Gateway路由、工具，全部通过契约调用它。

删除它会怎样。工厂扫描不到默认后端。记忆系统启动失败或退化到其他后端。Gateway的MemoryResponse形状契约也建立在DeerMem形状上，删除它会破坏前端记忆页面。

为什么是8分。它是功能依赖，不是存活依赖。可以换成noop或honcho后端。系统没有DeerMem也能跑。

为什么不是更低分。Gateway和前端硬编码了DeerMem形状。它实际上比"可插拔后端之一"更重要。它是事实上的标准。
