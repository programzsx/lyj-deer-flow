# GuardrailMiddleware-档案

## 一、这个类是干什么的

这个类是工具调用门禁的执行者。

这个类是LangGraph的AgentMiddleware。

这个类在每次工具调用之前插入授权检查。

检查的流程如下。

Middleware构造一个GuardrailRequest。

Middleware把请求交给GuardrailProvider评估。

提供者说允许，工具正常执行。

提供者说拒绝，工具不执行。

拒绝时Middleware返回一个错误ToolMessage。

代理收到错误消息后可以换一种做法。

提供者自己出错时的行为取决于fail_closed开关。

fail_closed为True时拒绝调用。

fail_closed为False时放行调用并记录警告。

这个类位于backend/packages/harness/deerflow/guardrails/middleware.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、构造方法

构造方法接受三个参数。

- provider是门禁提供者实例。
- fail_closed是失败开关。默认值是True。True表示提供者出错时拒绝调用。False表示出错时放行。
- passport是可选的代理身份字符串。

### 2、wrap_tool_call方法

这是同步钩子。

这个方法实现完整的门禁流程。

第一步，从LangGraph的ToolCallRequest解析运行时上下文。

第二步，构造GuardrailRequest。

第三步，调用提供者的evaluate。

第四步，处理异常。

LangGraph的GraphBubbleUp异常直接重新抛出。这类异常是interrupt、pause、resume等控制流信号，必须保留。

其他异常按fail_closed处理。fail_closed时构造拒绝决定，原因是"oap.evaluator_error"。非fail_closed时构造允许决定，并继续调用真正的handler。

第五步，允许时调用handler执行工具。拒绝时构造错误ToolMessage返回。

### 3、awrap_tool_call方法

这是异步钩子。

流程和wrap_tool_call完全相同。

区别是调用提供者的aevaluate并await handler。

### 4、_build_request方法

这个方法构造GuardrailRequest。

字段来源如下。

- tool_name和tool_input来自LangGraph的tool_call。
- thread_id、user_id、user_role、oauth_provider、oauth_id、run_id、channel_user_id、is_subagent来自运行时上下文字典。
- authz_attributes经过normalize_authz_attributes归一化。
- timestamp是当前UTC时间。
- agent_id是passport。
- is_internal在上下文的is_internal为True时为True。

### 5、_build_denied_message方法

这个方法构造拒绝消息。

消息格式包含工具名、原因代码、原因说明和一句"Choose an alternative approach"。

消息是status为error的ToolMessage。

### 6、_resolve_policy_identity方法

这个方法返回policy_id和policy_version两个字符串。

这个方法故意不调用提供者的release_policy_parameters。

原因是那个方法还会计算provider_parameters。

例如对允许名单排序。

而每次工具调用的授权结果记录路径只需要这两个字符串。

多余计算是浪费。

### 7、_build_authorization_outcome方法

这个方法把GuardrailDecision转换成AuthorizationOutcome。

转换内容包括decision、policy_id、policy_version和reason_codes。

### 8、_record_guardrail_event方法

这个方法把门禁决定持久化到RunJournal。

这是尽力而为的审计写入。

记录失败只打警告日志。

记录失败绝不改变工具执行行为。

运行时没有__run_journal时跳过记录。

内嵌客户端和子代理执行通常没有journal。

记录内容包含tool_name、tool_call_id、allow、policy_id、reason_codes、reason_messages、fail_closed、provider_error等字段。

reason_messages被截断到500字符。

### 9、release_policy_parameters方法

这个方法返回Middleware自身的策略参数。

字典包含fail_closed、passport、policy身份和provider_parameters。

## 三、它和谁协作

- GuardrailProvider是被它调用的门禁契约。
- GuardrailRequest和GuardrailDecision是请求和裁决对象。
- AuthorizationOutcome和put_authorization_outcome负责把决定写入运行时上下文。
- RunJournal负责持久化审计事件。
- normalize_authz_attributes负责归一化授权属性。
- MIDDLEWARE_GUARDRAIL_TAG是审计事件的标签。

## 四、重要性评级

评级是9分。

理由如下。

这个类是门禁机制的执行核心。

所有提供者的判断都要经过它才能生效。

它处理了三个关键边界。

第一个边界是GraphBubbleUp必须穿透。

第二个边界是fail_closed的失败语义。

第三个边界是审计记录不能影响执行。

它还负责把LangGraph类型转换成提供者无关的请求对象。

没有这个类，门禁提供者无法接入运行时。

扣掉1分。

扣分原因是同步和异步两个钩子逻辑大量重复。
