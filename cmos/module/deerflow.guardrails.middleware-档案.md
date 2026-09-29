# deerflow.guardrails.middleware

## 一、这个模块是干什么的

这个模块是守栏中间件。

背景是这样的。

代理每次要执行工具调用。

执行前要先判断这个调用允不允许。

判断由守栏提供者做。

中间件负责把判断接进执行链。

流程是这样的。

工具调用到达。

中间件构造一个请求。

请求里带工具名、输入、用户身份、线程id等。

请求交给提供者评估。

允许就放行。

拒绝就返回一个错误ToolMessage。

代理看到错误可以换一种做法。

提供者抛异常时的行为分两种。

fail_closed为True时阻塞调用。

fail_closed为False时放行并记警告。

默认是fail_closed。

这是安全优先的选择。

每次评估的授权结果会持久化。

持久化的理由是可审计。

中间件还有个细节。

它解析策略身份时不调release_policy_parameters。

因为那个方法还会计算provider_parameters。

授权路径只要两个身份字符串。

算参数是浪费。

## 二、模块里的主要成员

- GuardrailMiddleware：守栏中间件。是AgentMiddleware的子类。
- 构造参数有provider、fail_closed、passport。
- provider是守栏提供者。
- fail_closed决定提供者异常时阻塞还是放行。
- _resolve_policy_identity：解析策略id和版本。不做参数计算。
- 中间件在工具调用钩子里评估。
- 拒绝结果构造错误ToolMessage。错误消息有长度上限500。
- 授权结果写入authz的outcome存储。

## 三、它和谁协作

- 它依赖guardrails/provider的协议和数据结构。
- 它被agents/factory挂进中间件链。
- 它依赖authz模块持久化授权结果。
- 它被guardrails/typesafe和guardrails/builtin作为提供者。

## 四、重要性评级

评级是5分。

理由是它是工具授权的执行点。

fail_closed的默认选择是安全优先的。

授权结果持久化支撑了审计。

身份解析的效率细节说明设计经过了考量。

但守栏功能默认关闭。

不在默认执行路径上。
