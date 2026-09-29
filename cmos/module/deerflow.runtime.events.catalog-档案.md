# deerflow.runtime.events.catalog

## 一、这个模块是干什么的

这个模块定义持久化运行事件的名字和分类。

背景是这样的。

系统会把运行过程持久化成一条条事件。

每条事件有类型名和分类名。

如果没有统一的地方定义这些名字。

各个生产者就会各写各的字符串。

写错了没人发现。

这个模块就是那个统一的地方。

所有生产者从这里导入定义。

不再重复手写"事件名加分类"的组合。

更关键的是，前端的JSON契约在后端测试里对着这个目录校验。

两边任意一边单独改动，CI就会失败。

这就把契约漂移挡在了合并之前。

## 二、模块里的主要成员

- RunEventDefinition：一个固定事件的定义。包含event_type和category两个字段。是frozen的dataclass。构造时校验非空和长度上限。
- RunEventPattern：一个带占位符的事件模式。比如middleware:{tag}。它能用后缀生成完整的事件类型，并校验后缀长度。
- 固定事件定义包括这些。
- RUN_START_EVENT、RUN_END_EVENT、RUN_ERROR_EVENT：运行开始、结束、错误。
- LLM_HUMAN_INPUT_EVENT、LLM_AI_RESPONSE_EVENT、LLM_TOOL_RESULT_EVENT：消息类事件。
- LLM_ERROR_EVENT：模型错误。
- MEMORY_CONTEXT_EVENT：记忆上下文。
- SUBAGENT_START_EVENT、SUBAGENT_STEP_EVENT、SUBAGENT_END_EVENT：子代理生命周期。
- WORKSPACE_CHANGES_EVENT：工作区变更。
- MIDDLEWARE_EVENT_PATTERN：中间件事件的模式。分类固定为middleware。
- MIDDLEWARE_EVENT_TAGS：七种中间件事件标签的清单。包括guardrail、loop_detection、safety_termination、skill_activation、skill_secrets、tool_promotion、tool_progress。
- JOURNAL_RUN_EVENT_DEFINITIONS、SUBAGENT_RUN_EVENT_DEFINITIONS、FIXED_RUN_EVENT_DEFINITIONS：按生产者分组的事件集合，供校验用。

## 三、它和谁协作

- 它被runtime/journal.py引用。日志器用它发布运行事件。
- 它被子代理事件持久化和工作区变更记录引用。
- 它被guardrails中间件引用，比如MIDDLEWARE_GUARDRAIL_TAG。
- 它被后端测试引用，用来校验公开的JSON契约。
- 它依赖deerflow.constants里的长度上限和类型常量。

## 四、重要性评级

评级是7分。

理由是它是前后端事件契约的唯一事实来源。

没有它，事件名会静默漂移，前端解析会静默失败。

它把这种静默失败变成了CI失败。

但它只是定义，没有执行逻辑。
