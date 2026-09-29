# DeferredToolPromotionAuditMiddleware档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/tool_promotion_audit_middleware.py`

## 一、这个类是干什么的

DeferredToolPromotionAuditMiddleware观察最终的tool_search命令并持久化晋升决定。

tool_search执行之后会返回一个Command。
Command里记录了哪些延迟工具被晋升。

这个中间件包装在工具调用外面。
观察处理器的最终返回值。
算出实际生效的晋升。
再持久化成审计记录。

审计记录不携带敏感载荷。

它的位置要求是必须在SkillToolPolicyMiddleware外面。
工具调用包装按注册的相反顺序展开。
观察处理器的最终返回值才能保证被拒绝的模式不会被报告成生效的晋升。

## 二、类的成员

### （一）字段

- `deferred_names`：延迟工具名的frozenset。
- `catalog_hash`：工具目录哈希。

### （二）方法

钩子方法是重点。

- `wrap_tool_call`：同步钩子。等处理器返回最终结果。算出新的晋升。记录审计。
- `awrap_tool_call`：异步版本的同一个钩子。

辅助方法：

- `release_policy_parameters`：声明影响行为的配置。
- `_current_promoted`：从状态读当前已晋升集合。
- `_new_promotions`：从请求和最终结果里算出本次新增的晋升。
- `_record`：持久化晋升决定。

## 三、它和谁协作

- 它挂在DeferredToolFilterMiddleware和SkillToolPolicyMiddleware外面。
- 它观察的Command来自tool_search工具的执行。
- 它把审计记录交给RunEventStore类设施。

## 四、重要性评级

评级：5/10。

理由：这是审计性质的中间件。它不改变运行行为。它让"哪些工具因为什么被晋升了"可追溯。可观测性有价值但不是硬防线。所以给5分。