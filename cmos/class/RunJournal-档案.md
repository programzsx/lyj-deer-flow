# RunJournal档案

源码位置：`backend/packages/harness/deerflow/runtime/journal.py`

## 一、这个类是干什么的

这个类是运行日志记录器。

这个类继承LangChain的`BaseCallbackHandler`。

这个类夹在LangChain回调机制和可插拔的RunEventStore之间。

LangChain在agent运行时会触发各种回调。

模型开始、模型结束、工具开始、工具结束、链开始、链结束。

这个类接收这些回调。

这个类把回调数据标准化成RunEvent记录。

这个类把记录写进RunEventStore。

这个类还负责token用量的累计。

每次LLM调用消耗多少token。

总输入token、总输出token、总token。

按调用者分桶：主agent、子agent、中间件。

按模型分桶：每个模型各自的用量。

这些数据最后写进RunRow。

这个类的核心设计决定。

第一个，不实现`on_llm_new_token`。

流式token不记录。

只通过`on_llm_end`记录完整消息。

第二个，`on_chat_model_start`是提取第一条用户可见prompt的规范位置。

这里消息结构完整。

不会被检查点裁剪压缩。

第三个，`on_llm_end`产出`llm.ai.response`事件。

内容是检查点对齐的`AIMessage.model_dump()`格式。

第四个，调用者识别靠tags注入。

`lead_agent`、`subagent:{name}`、`middleware:{name}`。

这个类还处理一个微妙问题。

有些provider会对同一个run_id触发两次`on_llm_end`。

第一次没有usage。

第二次立刻补上usage。

这个类用`_PendingLlmResponse`暂存第一份。

等usage到了再合并。

provider可能复用并修改同一个response对象。

所以消息对象不能保留。

usage数据必须深拷贝。

这个类还负责工具结果的补录。

中间件可以自己回答工具调用并短路执行。

这时LangChain不会触发`on_tool_end`。

结果不会进事件存储。

用户在运行时看到了这个结果。

重载后结果消失了。

这个类在链结束和下一次模型开始时补录这些结果。

这个类还记录skill使用的快照、记忆上下文指纹、产出物的清单。

最后产出终端的`run.delivery`交付事件。

## 二、类的成员

这个类成员非常多。

按职责分组讲。

### （一）生命周期回调

- `on_chain_start`：根图调用时发出`run.start`事件。嵌套节点的事件不发。
- `on_chain_end`：根链结束时发出`run.end`事件。先补录最终输出里的工具结果。然后同步flush。
- `on_chain_error`：发出`run.error`事件。
- `on_chat_model_start`：记录LLM延迟起点。递增调用序号。补录已消费的工具结果。捕获第一条用户可见的人类输入。
- `on_llm_start`：后备。只记延迟起点。
- `on_llm_end`：核心回调。提取消息。深拷贝usage。处理错误回退标记。产出`llm.ai.response`事件。累计token用量。排队进度上报。
- `on_llm_error`：发出`llm.error`事件。
- `on_tool_start`：缓存正在执行的工具名。用于产出物归属。
- `on_tool_end`：处理工具输出。持久化工具结果消息。处理Command里的artifacts。记录产出物。

### （二）写入缓冲和flush

- `_buffer`：事件缓冲列表。
- `_flush_sync`：尽力flush。有事件循环就创建异步任务写store。没有就留在缓冲里。
- `_flush_async`：异步写批次。失败的事件退回缓冲重试。
- `flush`：强制flush剩余缓冲。worker的finally块调用。
- `_flush_if_threshold_reached`：缓冲达到阈值就flush。
- `_put`：内部标准入口。先提交暂存的LLM响应。再把事件放进缓冲。

### （三）LLM响应合并

- `_queue_llm_response_events`：排队一个逻辑响应。处理provider二次触发`on_llm_end`的合并。
- `_commit_pending_llm_response`：提交暂存的响应。
- `_merge_response_event_usage`：只把usage字段合并进规范事件。
- `_snapshot_message_summary`：在provider修改消息前冻结摘要字段。
- `_PendingLlmResponse`：暂存结构。见独立档案。

### （四）token用量

- `record_external_llm_usage_records`：记录外部来源的token用量。比如子agent。按source_run_id去重。
- `_record_model_usage`：按模型累计单次调用量。缺模型名归入`unknown`桶。缓存命中token单独记。
- `_extract_cache_read`：从usage里取prompt缓存命中数。
- `get_completion_data`：返回运行完成时的累计数据。总token、分桶token、按模型token、消息数、最后AI消息、第一条人类消息。

### （五）调用者和消息

- `_identify_caller`：从tags识别调用者。默认`lead_agent`。
- `_should_persist_human_input_message`：判断人类输入是否该持久化。隐藏消息里只有`ask_clarification`和`sandbox_network`来源的例外。
- `set_first_human_message`：记录第一条人类消息。
- `_persist_tool_result_message`：持久化工具结果事件。
- `_should_reconcile_tool_message`：判断工具结果是否需要补录。三个条件。用户可见。属于本次运行的lead agent调用。还没持久化过。
- `_reconcile_tool_messages`、`_reconcile_consumed_tool_messages`、`_reconcile_final_tool_messages`：补录逻辑。

### （六）其他记录

- `record_skill_usage`：记录skill加载的显示快照。最多64条。内容超长截断。
- `record_middleware`：记录中间件状态变更事件。跨线程时调度到拥有事件循环。
- `claim_tool_promotions`：原子认领未上报的工具名。用于延迟工具提升事件去重。
- `record_memory_context`：记录隐藏上下文的指纹。只记SHA-256。不记内容本身。
- `record_delivery`、`get_delivery_content`：终端交付事件。产出物按路径和工具去重。

### （七）关闭

- `close`：释放运行级引用。可选择先flush。失败时不静默丢弃。
- `_detach_runtime_dependencies`：清空所有外部引用和状态。

### （八）属性

- `feed_generation`：成功写入feed的单调计数。读方用它判断缓存未命中是否值得重试。
- `had_llm_error_fallback`：是否发生过LLM错误回退。
- `llm_error_fallback_message`：错误回退的文案。

## 三、它和谁协作

这个类和LangChain回调机制协作。

LangChain在agent运行的各个节点触发这个类的回调。

这个类和RunEventStore协作。

事件最终写进事件存储。

存储可以是memory、SQLite、JSONL、数据库。

这个类和runs worker协作。

worker创建这个类。在运行结束时调用`flush`和`close`。

worker读取`get_completion_data`写进RunRow。

这个类和中间件协作。

中间件调用`record_skill_usage`、`record_middleware`、`claim_tool_promotions`。

这个类和goal清理逻辑协作。

交付证据和终端状态要在goal被清除前定稿。

这个类和进度上报器协作。

`progress_reporter`回调接收运行进度快照。

## 四、重要性评级

评级：9分（满分10分）。

理由：

- 这个类是运行观测的核心。
- 用户看到的会话历史全部来自这个类的记录。
- 没有它，消息流、token统计、错误信息全部丢失。
- 重载后历史消失。
- 它处理了大量真实的边界情况。
- provider二次回调。
- 中间件短路的工具结果。
- 隐藏消息的例外规则。
- 跨线程事件循环。
- 这些都有对应的issue编号。
- 说明每个设计点都对应真实的用户可见bug。
- 它是核心运行时类。
- 核心运行时类评7到9分。
- 它是最复杂、影响面最大的一个。
- 评9分。
