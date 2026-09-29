# LoopDetectionMiddleware档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/loop_detection_middleware.py`

## 一、这个类是干什么的

LoopDetectionMiddleware检测并打断重复的工具调用循环。

这是一条P0级安全防线。
没有它，代理可能用同样的参数无限重复调用同一个工具。
直到递归上限杀掉整个运行。

检测有两层。

第一层是哈希层。把工具调用按名字加参数哈希。在滑动窗口里数相同哈希的出现次数。相同调用集合出现到警告阈值就注入提醒。到硬停阈值就把响应里的所有tool_calls剥掉。剥掉之后代理只能产出最终文本回答。

第二层是频率层。统计同一种工具在窗口里被调用的次数。能抓住换参数的跨文件读取循环。哈希层抓不住这种。每种工具还可以单独配阈值覆盖。

警告的注入时机很讲究。警告在`wrap_model_call`注入，而不是`after_model`。因为`after_model`触发时工具节点还没跑。此时插入的消息会落在tool_calls和它们的响应中间。OpenAI和Moonshot会拒绝这种消息序列。延迟到`wrap_model_call`之后，所有ToolMessage都在了。警告追加在最后。配对完整。

警告是瞬态的。运行结束前没被消费的警告由`after_agent`丢弃。不会带进同线程的下一次运行。

## 二、类的成员

### （一）字段

- `warn_threshold`：相同工具调用集合多少次后注入警告，默认3。
- `hard_limit`：相同集合多少次后剥离tool_calls，默认5。
- `window_size`：滑动窗口大小，默认20。
- `max_tracked_threads`：最多跟踪多少个线程/运行范围，超出就淘汰最久未用的，默认100。
- `tool_freq_warn`：同类型工具在频率窗口里的次数上限，默认30。
- `tool_freq_hard_limit`：同类型工具的硬停次数，默认50。
- `tool_freq_overrides`：按工具名覆盖频率阈值。给bash这类故意高频的工具抬上限用。

### （二）方法

钩子方法是重点。

- `before_model`和`abefore_agent`：运行开始时清理本运行的待发警告。
- `after_model`和`aafter_model`：模型响应之后记录工具调用并做两层检测。命中就产生_LoopDecision。
- `after_agent`和`aafter_agent`：运行结束时丢弃没消费的待发警告，释放回退锚点。
- `wrap_model_call`和`awrap_model_call`：把待发警告作为HumanMessage追加到出站消息末尾。

核心逻辑方法：

- `from_config`：从Pydantic校验过的配置构造。
- `_track_and_check`：两层检测的主逻辑。返回结构化决策。
- `_queue_pending_warning`：给当前线程/运行排队一条瞬态警告。带容量上限。
- `_drain_pending_warnings`：取走当前运行排队的全部警告。
- `_restore_pending_warnings`：模型调用抛异常时把警告塞回去。因为LLMErrorHandlingMiddleware会重试这个包装。重试必须还能找到警告。
- `_inject_warnings`：把警告追加到消息列表末尾。保持配对完整。
- `_evict_if_needed`：超出上限就淘汰最久未用的范围。
- `_format_warning_message`：把多条待发警告合并成一条提示。
- `consume_stop_reason`：取走并返回本次运行的硬停原因。子代理执行器用它把`loop_capped`带给lead。弹出是为了不让字典在复用实例上累积。
- `_get_thread_id`、`_get_run_id`、`_run_scope_key`、`_pending_key`：运行范围的键计算。
- `_record_audit_event`：持久化一次循环判定，不带敏感工具数据。
- `reset`：清空跟踪状态。可只清某个线程。

## 三、它和谁协作

- 它挂在lead agent和subagent的中间件链上。
- 它依赖BoundedDict做有界的运行状态存储。
- 它被SubagentLimitMiddleware和subagent执行器配合消费停止原因。
- 它和ToolProgressMiddleware分工。这个管调用模式。那个管单个工具的结果质量。
- 它的警告注入要和LLMErrorHandlingMiddleware的重试行为兼容。

## 四、重要性评级

评级：10/10。

理由：无限循环是最常见的代理失控模式。它烧钱、卡死线程、拖垮上游配额。这个中间件用双层检测覆盖了逐字重复和换参重复两种形态。注入时机的正确性避免了严格的提供方报错。它是P0安全防线。所以给满分。