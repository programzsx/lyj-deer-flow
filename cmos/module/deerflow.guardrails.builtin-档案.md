# deerflow.guardrails.builtin

## 一、这个模块是干什么的

这个模块提供内置的守栏提供者。

背景是这样的。

代理执行工具调用前要做授权。

授权由守栏提供者判断。

系统内置了一个最简单的提供者。

它就是AllowlistProvider。

它做允许列表和拒绝列表的判断。

它没有外部依赖。

工具在允许列表里就放行。

工具在拒绝列表里就拦下。

这里有一个关键的语义区分。

区分"没有配置允许列表"和"配置了一个空的允许列表"。

没有配置用None表示。

意思是放行所有工具。

配置了空列表用空set表示。

意思是什么工具都不放行。

如果用truthiness判断。

空的set会被当成None。

操作员的"什么都不许"就会失败成"什么都放行"。

这是fail-open，是危险的。

代码里明确注释了这一点。

## 二、模块里的主要成员

- AllowlistProvider：内置的允许/拒绝列表提供者。
- name是allowlist。policy_id是deerflow.guardrails.allowlist。
- evaluate(request)：同步评估。返回GuardrailDecision。
- aevaluate(request)：异步评估。直接复用同步逻辑。
- release_policy_parameters()：释放策略参数。给审计用。
- 构造时把None和空列表区分开。

## 三、它和谁协作

- 它实现guardrails/provider的提供者协议。
- 它被guardrails/middleware调用。中间件在每次工具调用前评估。
- 它被agents/factory引用。守栏功能开启时挂进中间件链。

## 四、重要性评级

评级是3分。

理由是它是守栏机制的最简单实现。

None和空列表的区分是一个真实的安全坑。

代码把它显式挡住了。

但守栏功能默认不开。

内置提供者也只有一个最简单的判断逻辑。

它是机制的一个示范实现。
