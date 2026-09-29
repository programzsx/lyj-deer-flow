# deerflow.agents.middlewares.safety_finish_reason_middleware档案

源码路径是backend/packages/harness/deerflow/agents/middlewares/safety_finish_reason_middleware.py。

## 一、这个中间件是干什么的

这个中间件修复被提供商安全终止的AIMessage。

修复的目标是让这些消息既不被执行，也不被持久化成空消息。

背景是两个真实缺陷。

一个是#3028，截断的工具调用。

一个是#4393，空响应污染线程。

有些提供商会在流中途安全停止生成。

OpenAI用finish_reason='content_filter'。

Anthropic用stop_reason='refusal'。

Gemini用finish_reason='SAFETY'。

这些提供商可能同时返回半成形的tool_calls。

LangChain的工具路由看到非空tool_calls字段就去执行。

所以截断了一半的参数也被当作完整调用分发。

比如一个markdown的write_file停在句子中间。

代理会看到截断的文件。

代理尝试修复。

又被过滤。

陷入循环。

这个中间件在after_model拦截这种行为。

检测器命中时做两件事之一。

有tool_calls时清除它们。

这是截断工具调用的场景。

消息完全空白时回填面向用户的解释。

这是空响应的场景。

空assistant消息会被持久化。

然后被严格的OpenAI兼容提供商在每次后续请求中拒绝。

提示是"assistant角色的消息不能为空"。

整个线程被卡住。

直到新开聊天。

带可见文本但没有tool_calls的安全终止消息不动。

这样部分回答仍然自然到达用户。

## 二、模块里的主要成员

### 1、SafetyFinishReasonMiddleware类

这个类继承AgentMiddleware。

__init__接收检测器列表。

没有传入就用default_detectors。

列表被拷贝。

防止调用者在构造后改动列表泄漏进来。

from_config从Pydantic配置构造。

显式空列表被拒绝。

空列表会悄悄禁用检测又把中间件留在链上。

这是最糟糕的组合。

想禁用就用enabled: false。

配置里的detectors是反射加载的。

每个entry带use和config。

resolve_variable加载类。

类型检查确保产出的对象是SafetyTerminationDetector。

release_policy_parameters声明action和检测器描述。

描述包含类名、name、finish_reasons、stop_reasons。

frozenset不可JSON序列化。

所以投影成排序列表。

### 2、检测

_detect遍历检测器。

检测器抛异常时记日志并当作不匹配。

有bug的检测器不能弄断代理运行。

第一个命中的检测结果被返回。

### 3、消息改写

_append_user_message向AIMessage内容追加纯文本解释。

这个方法镜像LoopDetectionMiddleware的_append_text。

列表内容的响应保持结构。

Anthropic的thinking块、vLLM的reasoning拆分不会被字符串强转。

_build_suppressed_message构造修复后的消息。

有tool_calls时用_USER_FACING_MESSAGE模板。

没有tool_calls时用_USER_FACING_EMPTY_MESSAGE模板。

模板填充reason_field、reason_value、detector。

消息用clone_ai_message_with_tool_calls清除工具调用。

这个助手一次性处理结构化tool_calls、原始additional_kwargs.tool_calls、function_call、provider工具调用内容块。

finish_reason只在旧值是tool_calls时被改写。

content_filter、refusal、SAFETY保持原样。

下游SSE和转换器继续看到真实的provider原因。

additional_kwargs被再克隆后盖safety_termination记录。

记录有detector、reason_field、reason_value、被抑制的数量和名字、extras。

### 4、可观测性

_emit_event发自定义流事件。

事件类型是safety_termination。

事件带detector、reason字段和值、被抑制的数量和名字、thread_id。

事件让SSE消费者能对账已经流给用户的"工具启动中"占位。

事件失败只记debug。

这是尽力而为的信号。

_record_audit_event写middleware:safety_termination记录到RunEventStore。

流事件被SSE客户端消费后消失。

审计事件被持久化。

操作员可以用一条SQL回答"今天哪些运行被安全抑制了"。

工具参数被故意不记录。

被过滤的内容正是参数本身。

持久化参数会打败安全过滤的目的。

名字、数量、id足以审计和调试。

RunJournal从runtime.context的__run_journal键取。

单元测试、子代理、无事件存储路径没有journal。

这些路径静默跳过。

### 5、主应用逻辑

_prepare_intervention做检测和改写准备。

最后一条消息必须是AIMessage。

两种失败模式值得改写。

第一种是有tool_calls。

tool_calls可能被截断。

所以抑制。

第二种是空白内容且没有tool_calls。

空的assistant消息会毒化线程。

所以回填解释。

message_content_to_text加strip判断空白。

空白包括纯空白字符。

然后跑检测器。

没有命中就不动。

命中后向runtime.context盖stop_reason为safety_capped。

这样worker能把这个封顶完成度和loop_capped、token_capped一起呈现。

对应#4176。

_apply调用_prepare_intervention。

非空时发事件和写审计。

然后返回消息更新。

### 6、钩子选择和装配位置

钩子是after_model。

不是wrap_model_call。

原因是响应是正常返回。

不是异常。

这个中间件要参与和LoopDetectionMiddleware相同的after-model链。

两者共享工具调用抑制机制。

但触发不同。

装配位置是在LoopDetectionMiddleware之后注册。

LangChain工厂反向顺序接线after_model边。

最后注册的中间件最先观察模型输出。

Safety在Loop之后注册。

所以Safety先看到原始响应。

Safety命中时清除工具调用。

Loop再对清理后的消息计数。

## 三、它和谁协作

它依赖safety_termination_detectors模块。

SafetyTermination、SafetyTerminationDetector、default_detectors都来自那里。

它依赖tool_call_metadata的clone_ai_message_with_tool_calls。

它依赖runtime/events/catalog的MIDDLEWARE_SAFETY_TERMINATION_TAG。

它依赖utils/custom_events的emit_custom_event和aemit_custom_event。

配置项是safety_finish_reason.enabled。

配置类是SafetyFinishReasonConfig。

它和LoopDetectionMiddleware在链上相邻。

Loop在前注册。

Safety在后注册。

它和ModelLengthFinishReasonMiddleware是对称设计。

一个处理安全终止。

一个处理长度截断。

## 重要性评级

评级是7分。

理由如下。

这个中间件修复两个真实缺陷。

截断工具调用会让代理陷入过滤循环。

空响应会毒化整个线程。

毒化的线程只能新开聊天。

这个中间件一次覆盖两类问题。

可观测性做得完整。

流事件给实时SSE。

审计事件给事后SQL查询。

参数不入审计日志是正确的取舍。

所以评7分。

不评更高分的原因是它默认关闭。

配置项是safety_finish_reason.enabled。

大多数部署不启用。

不评更低分的原因是一旦遇到会安全终止的提供商，这个中间件是线程不被毒化的唯一保障。
