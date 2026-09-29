# TokenBudgetMiddleware档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/token_budget_middleware.py`

## 一、这个类是干什么的

TokenBudgetMiddleware强制每次运行的token预算上限。

跟踪方式是这样的。

每次模型响应之后。把当前线程历史里所有AIMessage的usage_metadata加起来。
这样自动把子代理的token也算进来。
因为TokenUsageMiddleware会把子代理用量回填进历史。

三个维度。输入、输出、总数。
最高的那个占比超过警告阈值就排队警告。
超过硬停阈值就剥离工具调用。

警告注入用延迟模式。
after_model排队警告。不改状态。
wrap_model_call在下一次模型调用时作为HumanMessage注入。
保持AIMessage和ToolMessage的配对。

硬停不抛异常。
它剥离tool_calls让代理循环自然终止。产出最终回答。

运行范围用run_id做键。
一次Gateway运行可能为了隐藏的goal延续重新进入图。
那些延续共享同一个预算。
后来的用户运行拿到新的run_id。得到全新预算。

停止原因会暴露给调用方。
硬停触发的运行记录在停止原因表里。
子代理执行器在运行结束后调consume_stop_reason取走。
预算封顶的完成会带`stop_reason=token_capped`给lead。而不是看起来像干净的completed。

## 二、类的成员

### （一）字段

配置在`__init__`里传入。来自TokenBudgetConfig。

### （二）方法

钩子方法是重点。

- `before_agent`和`abefore_agent`：重建每消息的seen表。
- `after_model`和`aafter_model`：累加用量。判断阈值。警告或硬停。
- `after_agent`和`aafter_agent`：保留运行范围的用量和警告状态。
- `wrap_model_call`和`awrap_model_call`：注入排队的警告。

核心方法：

- `from_config`：从Pydantic校验过的配置构造。
- `consume_stop_reason`：取走并返回本次运行的停止原因。弹出防止字典跨运行累积。
- `_apply`：预算判断的主逻辑。
- `_build_hard_stop_update`：构建硬停的状态更新。剥离所有provider表面的工具调用。
- `_append_text`：把停止消息追加进AIMessage.content。兼容列表形态。
- `_drain_pending_warnings`和`_restore_pending_warnings`：警告的取走和回塞。重试必须还能找到警告。
- `_inject_warnings`：把警告追加到出站消息末尾。
- `_get_run_id`和`_context_run_id`：运行身份解析。没有run_id时用LangGraph的运行范围control对象。
- `reset`：清空状态。

## 三、它和谁协作

- 它挂在中间件链的尾部守卫位置。和LoopDetectionMiddleware相邻。
- 它依赖TokenUsageMiddleware回填的子代理用量。
- 子代理执行器消费它的consume_stop_reason。
- 它依赖BoundedDict做有界状态。
- 它的警告注入和LLMErrorHandlingMiddleware的重试行为兼容。

## 四、重要性评级

评级：9/10。

理由：token预算是成本失控的硬防线。一次失控的运行可能烧掉大量配额。这个中间件把子代理用量也算进来。封顶是真实的。停止原因让上层能区分预算封顶和正常完成。所以给9分。它不阻止第一个超限调用发生。所以不给满分。