# SafetyFinishReasonMiddleware档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/safety_finish_reason_middleware.py`

## 一、这个类是干什么的

SafetyFinishReasonMiddleware修复被提供方安全终止的AIMessage。

背景是这样的。

有些提供方会在流中间因为安全原因停止生成。
比如OpenAI的`finish_reason='content_filter'`。
比如Anthropic的`stop_reason='refusal'`。
比如Gemini的`finish_reason='SAFETY'`。

停止时可能还返回了半成品的tool_calls。
LangChain的工具路由只看tool_calls是否非空。
半截参数也会被当成完整的去执行。
比如一个markdown写文件调用停在句子中间。
代理看到截断的文件，试图修复，又被过滤，然后循环。

这个中间件在`after_model`位置拦截。

有两种修复。

第一种是消息带tool_calls。把工具调用剥掉。结构化的和原始的provider载荷都剥。这是截断场景。

第二种是消息基本是空的。没有工具调用也没有可见内容。给它补一条用户可读的解释。空助手消息如果不补，会被严格的OpenAI兼容提供方在后续每个请求里拒绝。整个线程就被卡死。这是空响应场景。

消息带可见文本但没有工具调用的，不动。部分回答照样给用户。

钩子选在`after_model`而不是`wrap_model_call`。因为响应是正常返回，不是异常。这样能和LoopDetectionMiddleware在同一个链位协作。

## 二、类的成员

### （一）字段

- `detectors`：一组SafetyTerminationDetector。决定识别哪些提供方的安全终止信号。

### （二）方法

钩子方法是重点。

- `after_model`和`aafter_model`：模型响应之后检测安全终止信号。命中就剥离工具调用或补解释。把观测字段写进additional_kwargs的safety_termination。

核心方法：

- `from_config`：从校验过的配置构造。显式空列表会被拒绝。因为空列表等于在链里挂着但检测全关，这是最坏组合。想关检测应该用`enabled: false`。
- `_detect`：用检测器列表在消息上找安全终止。
- `_build_suppressed_message`：构建剥离工具调用后的消息。
- `_append_user_message`：把解释追加进消息内容。兼容列表形态的内容块。
- `_emit_event`和`_aemit_event`：发SSE事件通知前端。让前端撤掉已经流出去的"工具启动中"占位。失败只记debug，尽力而为。
- `_record_audit_event`：把`middleware:safety_termination`记录写进RunEventStore。SSE事件是活的，运行结束就没了。这条持久化让操作员能查"今天哪些运行被安全抑制了"。工具参数故意不记录。参数正是被过滤的内容。记下来就白过滤了。
- `_prepare_intervention`：准备一次干预。
- `_apply`：应用干预，返回状态更新。

## 三、它和谁协作

- 它挂在中间件链的模型响应之后位置。
- 它依赖一组SafetyTerminationDetector。检测器按提供方划分。
- 它和LoopDetectionMiddleware在同一个after_model链位协作。
- 它向SSE消费者和RunEventStore发事件。
- TodoMiddleware等下游守卫会读取它盖的标记。

## 四、重要性评级

评级：9/10。

理由：安全终止的半截工具调用会导致执行坏数据和死循环。空响应会毒化整个线程。这两个问题都属于数据完整性和稳定性级别的故障。这个中间件同时修了两个。审计和前端同步也做全了。所以给9分。