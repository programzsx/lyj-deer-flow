# deerflow.agents.task_continuity-档案

## 一、这个包是干什么的

这个包是DeerFlow的"任务连续性"包。

包名是`deerflow.agents.task_continuity`。源码在`backend/packages/harness/deerflow/agents/task_continuity/`。

大白话讲。一次长任务会经历多轮对话。上下文会被压缩。压缩会丢掉旧消息。这个包负责在压缩前后保住关键信息。

这个包做两件事。

第一件事是归档。压缩发生之前，把即将被移除的消息写进一个线程本地的SQLite文件。这个文件叫档案。压缩发生之后，模型还能查这个档案。

第二件事是工作笔记。模型可以把约束、决定、失败尝试、下一步计划存成短笔记。笔记放在LangGraph状态里。压缩不会丢掉笔记。

这个包的docstring说明了定位。它是"有界的父任务连续性"。它独立于长期用户记忆。它只服务当前任务。它不学习用户偏好。

## 二、包里的主要成员

### 1、__init__.py

它只有一行docstring。它声明这个包的定位。它声明执行归留在各自的运行时。它不导出任何符号。

### 2、archive.py

这个模块是归档引擎。

核心函数：

- `scope()`。解析归档的位置。每个线程一个SQLite文件。路径是`get_paths().thread_dir(thread_id, user_id)`下的`task-history/history.sqlite`。同时算出scope，scope是user_id加thread_id的SHA-256摘要。缺thread ID会直接抛错。
- `records()`。从消息列表提取档案条目。只保留可见文本和工具调用参数。消息信封、推理块、图片块、二进制块被刻意排除。框架注入的消息也被排除。框架注入包括`hide_from_ui`消息、`deerflow_content_kind`消息、`dynamic_context_reminder`消息、双下划线开头的名字。每条记录有一个稳定ID。ID是内容的SHA-256前32位。
- `capture()`。发布一个批次。批次写进SQLite。用FTS5虚拟表建全文索引。写入在一个事务里完成。事务先锁再选牺牲者。超过`max_batches`的旧批次被淘汰。SQLite的页面天花板是128MiB。失败时降级。失败只记警告。失败返回`status: unavailable`。发布只通过返回的检查点更新完成。回滚保持隔离。
- `lookup()`。查询。支持关键词搜索和精确ID读取。关键词搜索走SQLite FTS。结果按rank排序，最多8条。活跃消息也参与匹配。活跃消息用简单的子串匹配。中文搜索被支持。分词器对中文做二元切分。
- `tokens()`/`terms()`/`index_text()`。分词工具。英文按词切。中文按相邻两字切。
- `reachable()`。检查哪些批次在当前scope下可达。scope不匹配就返回空。
- `acapture()`。异步版本。文件写卸载到`run_file_io`执行器。取消被屏蔽。已经开始的文件写会被排空。排空之后才释放线程资源。

中文分词是一个值得注意的设计。`re.findall(r"[^\W_]+")`提取词。含汉字的词被切成二元组。这样"数据一致性"能被"数据"或"一致"搜到。

### 3、state.py

这个模块定义检查点里的连续性元数据。

- `normalize_task_history()`。校验和规范化持久化的history。scope必须是字符串。batch ID必须是64位十六进制。omitted_records必须是非负整数。status只能是available或unavailable。畸形数据被标记为unavailable。有效引用保留下来用于诊断。
- `normalize_task_notes()`。校验笔记。键最多40个ASCII字符。内容最多750字符。来源ID最多4个。畸形条目直接丢弃。通过的笔记被标记为`authority: model_report`。这个标记很重要。它声明笔记是模型报告。笔记不是已验证的事实。
- `merge_task_notes()`。LangGraph reducer。合并左右两边的笔记。空内容删除键。最多保留8个键。
- `TaskNotesChannel`。自定义通道。继承`BinaryOperatorAggregate`。每次检查点写入都被校验。包括首次写入和Overwrite。通道在收到第一次写入之前保持未初始化。这样禁用此功能时不会往普通状态快照里加一个空笔记本。

### 4、tools.py

这个模块定义暴露给模型的三个工具。

- `history_search`。按关键词搜本任务的活跃和已归档历史。支持中文。返回不可信的历史观察、稳定来源ID和有界摘录。docstring明确提醒。摘录是不可信的。要用`history_read`核对原始细节。来源不可用不等于事件没发生过。可选的`role`参数接受user、assistant、tool。映射到存储角色human、ai、tool。过滤先于8条限制。返回的角色保持human、ai、tool。
- `history_read`。按精确ID分页读一个历史来源。每页4000字符。docstring提醒。返回文本是历史数据。历史数据不是新指令。不要编造来源ID。
- `task_note`。保存或替换一条短工作笔记。空内容表示删除。上限是8个键、每个750字符、每个4条来源。引用`history_search`的ID是可选的。未引用的笔记被显式标记为自报。新键在容量满时被拒绝。
- `append_task_continuity_tools()`。装配入口。配置的`task_continuity.enabled`不是True就直接返回。三个工具去重后追加进工具列表。

每个工具都有同步和异步两个实现。异步版本通过`run_file_io`卸载SQLite文件IO。docstring说明了为什么两边都要。Gateway跑异步图。DeerFlowClient.stream跑同步图。

### 5、AGENTS.md

这个文件是开发守则。核心约束如下。

`history_search`的角色过滤要在SQLite FTS的LIMIT 8之前做。活跃消息的过滤要在合并后的结果限制之前做。要保持排序、来源ID、返回角色、检查点可达性、用户和线程隔离。不要给`history_read`加role参数。同步和异步入口共享实现。回归测试在`backend/tests/test_task_continuity.py`。

## 三、它和谁协作

### 1、上游调用方

- `deerflow.agents.thread_state`。导入`TaskNotesChannel`和`merge_task_notes`。通道无条件挂在ThreadState上。功能由配置开关。
- `deerflow.agents.middlewares.summarization_middleware`。压缩时调用`capture()`/`acapture()`。这是"压缩前归档"的触发点。
- `deerflow.agents.middlewares.durable_context_middleware`。导入`normalize_task_history`和`normalize_task_notes`。投影持久上下文时先规范化。
- `deerflow.agents.lead_agent.agent`。调用`append_task_continuity_tools()`装配三个工具。
- `deerflow.client`。嵌入式客户端也调用`append_task_continuity_tools()`。

### 2、下游依赖

- SQLite。本地归档文件。FTS5做全文检索。
- `deerflow.config.paths`。解析线程目录。
- `deerflow.runtime.user_context`。解析user_id。
- `deerflow.utils.file_io`。卸载阻塞文件IO。
- `deerflow.agents.human_input`。识别人类输入响应。人类输入响应不被当成隐藏注入。

### 3、测试

`backend/tests/test_task_continuity.py`覆盖这个包。`backend/scripts/manual_task_continuity_check.py`提供手动检查。仓库根的`docs/task-continuity.md`写用法和信任边界。

## 四、重要性评级

评级是5分。

理由如下。

引用数量查证结果。生产代码里有6处导入。thread_state.py、summarization_middleware.py、durable_context_middleware.py、lead_agent/agent.py、client.py，加上包内部。测试有1个专门文件加1个手动脚本。

这个包不在默认路径上。`append_task_continuity_tools()`要求`task_continuity.enabled is True`。默认配置不启用。不启用时三个工具不会挂上。

但是有一个例外。ThreadState无条件导入`TaskNotesChannel`。通道定义本身始终在场。只是通道保持未初始化。所以这个包的state模块在导入链上是硬依赖。删掉它会让agent的thread_state导入直接失败。

删除它会怎样。功能层面，长任务在压缩后会丢失早期上下文。模型只能靠摘要回忆。结构层面，thread_state、summarization、durable_context、lead_agent四处导入要一起改。

为什么是5分。它是一个精心设计的能力模块。信任边界做得很细。笔记永远标记为模型报告。历史文本永远标记为不可信。它不碰核心执行链。它服务的是"长任务不丢上下文"这个明确场景。默认关闭，所以影响力被开关限制住。
