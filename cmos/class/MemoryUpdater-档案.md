# MemoryUpdater档案

源文件位置：backend/packages/harness/deerflow/agents/memory/backends/deermem/deermem/core/updater.py

## 一、这个类是干什么的

这个类是基于LLM的记忆更新器。

这个类负责用大语言模型从对话里提取记忆。这个类也负责记忆数据的读写和事实的增删改查。

这个类是DeerMem记忆后端的大脑。队列攒好一批对话后交给这个类。这个类先把对话格式化成提示词。然后调用LLM。然后解析LLM的返回。然后应用更新。最后持久化。

这个类的更新是尽力而为的。失败会被吞掉。失败时水位线不推进。下一轮对话会重新喂入这批消息。

这个类还有容量控制。事实数量超过上限时，这个类调用淘汰策略。这个类还负责确认确认机制。确定性的消息处理才能确认一条事实。

## 二、类的成员

### （一）字段

- _config：DeerMem私有配置。
- _storage：注入的存储实例。存储实例由DeerMem拥有。
- _llm：用于记忆提取的聊天模型。模型由DeerMem拥有。没有配置LLM时为None。
- _prompts_dir：可选的自定义提示词模板目录。
- _callbacks：可选的MemoryCallbacks。回调在LLM调用前合并追踪元数据。
- _watermarks：水位线缓存。水位线记录每个（thread_id，user_id，agent_name）键最后提取的消息身份。缓存是有界的LRU。缓存被丢弃的键会在该线程下一轮重新提取一批。

### （二）主要方法

- update_memory：同步更新记忆的核心入口。这个方法用同步LLM路径。同步路径用model.invoke。同步路径和主智能体的异步连接池完全隔离。这消除了跨事件循环连接复用的bug。在运行中的事件循环里调用时，这个方法把阻塞调用卸载到线程池。
- _do_update_memory_sync：执行同步更新的内部方法。
- _do_update_memory_sync_impl：同步更新的完整实现。实现包括提示词准备、LLM调用、结果解析、应用更新。
- _prepare_update_prompt：准备更新的提示词。
- _finalize_update：最终化更新。最终化包括容量控制和持久化。
- _apply_updates：把LLM返回的更新应用到当前记忆。
- _select_for_capacity：应用配置的淘汰策略。可选地计算hybrid影子决策。
- _record_capacity_decision：记录容量淘汰决策。
- _judge_batch：对批次调用注入的记忆裁判。
- _build_signal_hints：把确定性信号转换成提示词提示。
- _watermark_get和_watermark_set：水位线的读写。
- _feed_after_watermark：过滤掉水位线之前的消息。
- get_memory_data：通过存储读取当前记忆数据。
- reload_memory_data：通过存储重新加载记忆数据。
- import_memory_data：导入记忆数据。
- clear_memory_data：清空指定范围的记忆数据。
- clear_all_memory_data：清空一个用户的全部记忆。
- create_memory_fact：创建一条事实。
- delete_memory_fact：删除一条事实。
- update_memory_fact：更新一条事实。
- _emit_extraction_metrics：发出提取指标。
- _notify_llm_result：通知LLM调用的结果。

## 三、它和谁协作

- MemoryUpdateQueue是它的上游。队列把批次交给这个类处理。
- MemoryStorage是它的存储层。这个类通过注入拿到存储实例。这个类调用存储的load、save、apply_changes、get_fact_usage等方法。
- select_facts_for_capacity是它的淘汰函数。这个函数来自eviction模块。
- load_prompt和load_prompt_messages是它的提示词加载函数。这些函数来自prompt模块。
- format_conversation_for_update是它的对话格式化函数。这个函数来自prompt模块。
- detect_signals是它的信号检测函数。这个函数来自message_processing模块。
- MemoryCallbacks是它的可选回调接口。

## 四、重要性评级

评级：9分。

理由：这个类是记忆后端的核心更新类。记忆的提取、解析、应用、持久化全部经过这个类。这个类承载了水位线机制。水位线机制决定哪些消息被提取。这个类承载了容量控制。容量控制决定哪些事实被保留。这个类还解决了真实的跨事件循环连接复用bug。这个类出问题，记忆就不会被写入。这个类是全项目最关键的记忆组件之一。
