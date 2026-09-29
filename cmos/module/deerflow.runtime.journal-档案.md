# deerflow.runtime.journal 档案

## 一、这个模块是干什么的

这个模块是整个运行时的事件捕获中枢。

DeerFlow每次运行会产生大量事件。用户说了什么。模型回了什么。工具调了什么。用了多少token。中间件改了什么状态。

这些事件怎么记下来。就是这个模块的事。

`RunJournal`是核心类。它是一个LangChain回调处理器。

它坐在LangChain的回调机制和可插拔的RunEventStore之间。

回调数据进来。它标准化成RunEvent记录。攒一批。写进事件存储。

它还负责token用量统计。按调用者分桶。按模型分桶。

它还负责历史种子。分支继承的历史。旧checkpoint迁移的历史。都由它序列化成事件行。

这个模块是runtime目录里最大的文件。1387行。里面堆满了精心的边界处理。

## 二、模块里的主要成员

### RunJournal类

- `on_chain_start`。根调用开始时发一条run.start事件。嵌套节点不发。

- `on_chat_model_start`。记录LLM延迟起点。捕获当前运行的tool call名字。捕获第一次用户可见的输入。第一次人类消息在这里提取。因为这里消息结构完整。不会被checkpoint裁剪压缩。

- `on_llm_end`。最复杂的回调。发出llm.ai.response事件。累积token。处理LLM错误回退标记。处理技能使用快照。它要处理一个特殊问题。有的提供商会用同一个run_id触发两次on_llm_end。第一次没有用量。第二次马上补上用量。第一次回调的生成集永远是权威的。第二次只能补充用量字段。不能增删消息。

- `on_llm_error`。记录LLM错误事件。

- `on_tool_start`和`on_tool_end`。缓存工具名。持久化工具结果消息。处理Command输出。Command带非空artifacts更新时记录产物。用于run.delivery事件。

- `record_skill_usage`。捕获技能加载的展示证据。下一条终局AI回复会带上这些快照。

- `record_middleware`。记录中间件状态变更事件。跨线程调用时会调度到拥有journal的事件循环。绝不从worker线程直接改缓冲。

- `claim_tool_promotions`。原子地认领尚未报告的工具名。并行tool_search会读同一个前置状态。状态diff会把同一个schema标成新的多次。认领机制去重。

- `record_memory_context`。记录隐藏上下文的指纹。只存sha256。不存内容。

- `record_external_llm_usage_records`。记录外部来源的token用量。例如子agent。用source_run_id去重。

- `get_delivery_content`和`record_delivery`。终局的run.delivery事件。记录本次运行产出的产物路径。

- `flush`和`close`。强制刷缓冲。释放运行级引用。close分两种。带flush的close保留存储引用让重试成为可能。不带flush的close先脱离依赖再取消已调度的任务。

- `feed_generation`。单调递增的feed写入计数。读缓存的消费者用它判断"上次的miss值不值得重问"。

### 历史种子函数

- `_build_history_seed_events`。把checkpoint消息序列化成事件行。按人消息边界分组合成运行。每个回合一个run_id。这是关键设计。如果整个种子共用一个id。分支第一次重新生成会删掉全部继承历史。每回合一个id把删除限制在被重新生成的那个回合。

- `build_branch_history_seed_events`。分支继承历史用。带branch_seed元数据。

- `build_checkpoint_history_seed_events`。旧checkpoint迁移用。带checkpoint_history_seed元数据。

### 缓冲与去重机制

- `_buffer`。事件写入缓冲。攒到阈值就异步批量写。

- `_pending_llm_response`。挂起的LLM响应事件。等待可能的用量补发。

- `_counted_llm_run_ids`等。多套去重集合。防止token重复计数。

## 三、它和谁协作

它依赖`runtime/events/catalog.py`拿事件类型。依赖`runtime/events/store/base.py`的RunEventStore。

它依赖`agents/human_input.py`和`agents/middlewares/skill_usage.py`。

它依赖`utils/messages.py`做文本提取和原始消息恢复。

它的调用方是`runtime/runs/worker.py`。worker创建journal。挂到图上。跑完调flush和close。

Gateway的流式发布和REST响应都消费它产出的事件行。

中间件通过`record_middleware`向它写事件。子agent通过`record_external_llm_usage_records`上报用量。

## 四、重要性评级

评级是10分。

理由如下。

它是运行历史的唯一记录通道。用户在界面上看到的每条消息。每次工具调用。每条token统计。全部经过它。

它的正确性直接决定用户数据的完整性。工具结果漏记。用户重载页面就看不到那条结果。种子run_id共用。重新生成会误删整个继承历史。这些都是真实发生过的bug（#4666、#4458）。

它处理了并发正确性。多个并行工具调用、跨线程中间件、提供商的重复回调。每一处都有明确的归属和去重规则。

它是runtime目录里体量最大、边界最密的模块。AGENTS.md里有大量条目在描述它的行为契约。

它是这批模块里无可争议的第一名。
