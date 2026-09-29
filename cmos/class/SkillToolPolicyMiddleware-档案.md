# SkillToolPolicyMiddleware档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/skill_tool_policy_middleware.py`

## 一、这个类是干什么的

SkillToolPolicyMiddleware把技能声明的allowed-tools应用到激活的技能上。

核心规则是这样的。

仅仅启用一个技能只是让它可被发现。
不会激活它的权威策略。

一个技能变成策略激活有两种途径。

第一种是用户为本轮运行斜杠激活了它。

第二种是模型把它加载进了skill_context。

斜杠激活在本运行的剩余时间里占主导。
被动读取第二个技能不能扩大斜杠技能的权威。

这个中间件做两件事。

在模型调用边界。把模型可见的工具模式过滤成激活技能声明的集合。

在工具调用边界。阻止不在授权集合里的调用。

策略决策会存进运行上下文。本轮的工具调用复用这个决策。
每次模型调用都会刷新决策。格式坏掉、外来的、过期的、不匹配的决策回退到实时解析。

两种失败方向都收敛到框架安全工具。注册表加载失败。激活集合非空但没有任何授权技能。都收敛到框架安全工具。

它的定位是尽力而为的行为范围控制。不是硬安全边界。比如bash cat这种替代加载方式不会被采集。有界的自动skill_context会淘汰旧条目。

它的位置要求是必须紧跟SkillActivationMiddleware之后、DurableContextMiddleware之前。

## 二、类的成员

### （一）字段

配置在`__init__`里传入。

### （二）方法

钩子方法是重点。

- `wrap_model_call`和`awrap_model_call`：模型调用边界。算激活策略。过滤模型可见的工具模式。存策略决策。
- `wrap_tool_call`和`awrap_tool_call`：工具调用边界。按策略阻止未授权调用。过滤tool_search结果。

核心方法：

- `release_policy_parameters`：声明影响行为的配置。
- `_active_policy`：算当前的策略签名。来源是斜杠激活或skill_context。
- `_active_skills_for_paths`：把路径解析成激活技能列表。
- `_allowed_names_for_paths`：算授权工具名集合。
- `_filter_model_request`：过滤模型请求的工具模式。
- `_blocked_tool_message`：构建阻止消息。
- `_filter_tool_search_result`：从tool_search输出里移除被拒绝的模式和晋升。保持tool_search可用但越不过授权边界。
- `_tool_search_policy_error`：构建tool_search的策略错误。
- `_store_policy_decision`和`_read_policy_decision`：策略决策的存取。带中间件令牌绑定。
- `_storage`：拿SkillStorage实例。

## 三、它和谁协作

- 它挂在SkillActivationMiddleware之后。消费斜杠激活发布的来源。
- 它在DurableContextMiddleware之前。装配测试钉住这个顺序。
- 它依赖SkillStorage读技能声明。
- DeferredToolPromotionAuditMiddleware必须包在它外面。
- 它消费ThreadState.skill_context。

## 四、重要性评级

评级：8/10。

理由：技能的allowed-tools是权限边界。没有这个中间件。一个被动的技能启用就能扩大模型可用的工具面。它把"可发现"和"有权威"分开。斜杠激活的主导规则避免了权限被逐步蚕食。tool_search的过滤补住了发现层的绕过。它是行为边界而非硬安全边界。所以给8分。