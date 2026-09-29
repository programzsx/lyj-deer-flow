# deerflow.guardrails-档案

## 一、这个包是干什么的

这个包是DeerFlow的"护栏"包。

包名是`deerflow.guardrails`。源码在`backend/packages/harness/deerflow/guardrails/`。

大白话讲。agent在执行工具调用之前要过一道检查。这道检查问一个问题。这次调用该不该继续。这个包实现这道检查。

这个包做三件事。定义provider协议。提供中间件。提供两个内置provider。

它和`deerflow.authz`是兄弟关系。authz是policy brain。guardrails是执行时检查。这个包的docstring说明了边界。PR #3665把guardrails限定在执行时检查。那次PR明确说不在这个包里加policy engine和RBAC系统。RBAC的大脑后来放进了authz包。

拒绝的调用返回一个错误ToolMessage。agent看到错误后会换一种做法。运行不会崩溃。

## 二、包里的主要成员

### 1、provider.py

这个模块定义协议和数据结构。

- `GuardrailRequest`。每次工具调用传给provider的上下文。字段有tool_name、tool_input、agent_id、thread_id、is_subagent、timestamp。还有授权身份字段。user_id、user_role、oauth_provider、oauth_id、run_id、tool_call_id、channel_user_id、is_internal、authz_attributes。授权身份字段由GuardrailMiddleware从运行上下文填充。默认值保证向后兼容。
- `GuardrailReason`。结构化理由。code加message。
- `GuardrailDecision`。allow加reasons加policy_id加metadata。
- `GuardrailProvider`。协议。任何有name、evaluate()、aevaluate()的类都行。不需要基类。provider按类路径通过resolve_variable()加载。和模型、工具、沙箱用同一机制。

### 2、middleware.py

这个模块是`GuardrailMiddleware`。核心中间件。

它继承`AgentMiddleware`。在工具调用执行前评估provider。

- `wrap_tool_call()`。同步钩子。构建GuardrailRequest。调用provider.evaluate()。allow就继续调用handler。deny就返回错误ToolMessage。
- `awrap_tool_call()`。异步钩子。同样逻辑。
- `release_policy_parameters()`。释放策略参数。fail_closed、passport、policy身份、provider参数。供装配描述符使用。
- `_resolve_policy_identity()`。只要policy_id和policy_version两个字符串。刻意不调provider的完整release_policy_parameters。因为那里还会排序allow/deny列表。这是每次工具调用的路径，浪费不起。

失败策略由`fail_closed`参数决定。

- `fail_closed`为True（默认）时。provider抛错就阻止调用。返回失败裁决。
- `fail_closed`为False时。provider抛错就放行。记警告。

`GraphBubbleUp`被保留。这是LangGraph的控制流信号。interrupt、pause、resume不能被吞掉。

审计持久化是尽力而为的。guardrail决策写进RunJournal。没有`__run_journal`的运行时（嵌入式、子agent）跳过持久化。持久化失败只记警告。审计永远不改变工具执行行为。

每次决策还写一个`AuthorizationOutcome`进运行上下文。那是authz包的契约。

### 3、builtin.py

这个模块是内置provider。`AllowlistProvider`。

简单的allowlist/denylist provider。无外部依赖。

- `allowed_tools`为None表示允许所有工具。
- `allowed_tools`为空列表表示什么都不允许。

这个区分写在注释里。真值测试会把空列表折叠成None。这会fail open。操作员想禁止所有工具时全部工具会被放行。所以用`is not None`判断。

- `release_policy_parameters()`。释放排序后的allow/deny列表。

### 4、typesafe.py

这个模块是TypeSafe（Jev）provider。约22KB。

它是一个风险门。在工具执行前问一个noul问题。`risky_tool_call`。这次工具调用是否可能造成不可逆或超出范围的影响。概率达到threshold就拒绝。

这个provider的三个承重设计写在docstring里。

- state用严格JSON构建。无default参数。allow_nan=False。序列化不了的参数在本地被拒绝。截断后的前缀永远不会成为裁决依据。
- 超时是预算不是保证。异步路径通过asyncio.timeout取消。同步路径无法抢占阻塞调用。所以在响应头之后、body读取期间、解析之后检查deadline。晚到的结果被丢弃。
- client的生命周期就是一次评估。transport_factory是工厂不是实例。

`allowed_tools`是硬权限列表。不是评估的豁免。列表外的工具在本地被拒绝。永远不会被探测。列表内的工具仍然要过风险门。

拒绝进RunJournal。允许不持久化。记录的reason消息带重放threshold比较所需的字段。概率、threshold、模型版本、state摘要。

连接设置的优先级。这个provider自己的配置。然后顶层的`typesafe:`配置块。然后内置默认值。多个TypeSafe消费者可以共享一个块。

### 5、__init__.py

导出全部公共符号。AllowlistProvider、GuardrailMiddleware、协议、类型、TypeSafe。

## 三、它和谁协作

### 1、上游调用方

- `deerflow.agents.middlewares.tool_error_handling_middleware`。装配时引用GuardrailMiddleware做顺序约束。
- `deerflow.extensions.ordering`。顺序不变量把GuardrailMiddleware当约束双方。它是短路的中间件之一。它能返回或重建ToolMessage而不调handler。
- `deerflow.authz.adapter`。`GuardrailAuthorizationAdapter`把authz决策喂给这个包的中间件。
- `deerflow.extensions.stack`。TOOL_RAW和MODEL_PHYSICAL锚点的注释提到它。
- `deerflow.config.guardrails_config`。配置定义。
- 配置样例`config.example.yaml`里有guardrails配置段。

### 2、下游依赖

- LangChain和LangGraph。AgentMiddleware、ToolCallRequest、GraphBubbleUp。
- `deerflow.authz.outcome`。写授权结果。
- `deerflow.authz.principal`。normalize_authz_attributes。
- `deerflow.typesafe`。TypeSafe客户端、连接、校验。
- `deerflow.runtime.events.catalog`。MIDDLEWARE_GUARDRAIL_TAG。

### 3、测试

大约12个测试文件引用这个包。test_guardrail_middleware、test_typesafe_guardrail_provider、test_typesafe_client、test_typesafe_config、test_authorization_enforcement、test_artifact_safety_review等。还有blocking_io目录下的test_typesafe_guardrail_provider。`backend/scripts/eval_typesafe_risk_gate.py`是TypeSafe的启用前评估脚本。`backend/docs/GUARDRAILS.md`写整体文档。

## 四、重要性评级

评级是7分。

理由如下。

引用数量查证结果。全仓库约33个文件引用`deerflow.guardrails`。其中生产代码约15处。测试约12个文件。文档和CHANGELOG若干。

这个包是工具执行安全检查的执行点。启用guardrails配置后，每次工具调用都经过`GuardrailMiddleware`。它是中间件链里唯一在工具执行前做拦截的通用检查点。它也是authz决策的执行载体。authz包通过适配器把自己的决策喂给它。

删除它会怎样。所有`from deerflow.guardrails`的导入失败。涉及lead_agent装配链、extensions/ordering、authz/adapter、tool_error_handling_middleware。系统无法启动。TypeSafe风险门消失。内置allowlist消失。authz的运行时拒绝层失去执行载体。

为什么是7分不是9分。它受`guardrails`配置开关保护。`test_create_deerflow_agent.py`确认了guardrail=False（默认）时没有GuardrailMiddleware。默认部署里它不在中间件栈上。它不像authz那样被几十个文件引用。

为什么不是更低分。它在启用后是每次工具调用的必经路径。它承载了两套安全能力。自己的护栏检查和authz的执行时拒绝。`extensions/ordering`把多个顺序不变量压在它身上。它是ToolReceipt、ArtifactResolution等中间件的约束对象。它在安全链里的位置不可替代。
