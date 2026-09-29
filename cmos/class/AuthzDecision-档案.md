# AuthzDecision-档案

# 一、这个类是干什么的

AuthzDecision定义在`backend/packages/harness/deerflow/authz/provider.py`。

这个类表示"授权提供者的判断结论"。

授权检查最终要给出一个结论。

这个结论是"允许"还是"拒绝"。

AuthzDecision就是这个结论。

模块docstring说明这个类是"Provider's allow/deny verdict"。

`AuthorizationProvider`协议的`authorize`方法返回这个对象。

调用方读`allow`字段做决策。允许就放行。拒绝就拦截。

这个类是一个dataclass。这个类只装数据。这个类不做判断。

判断逻辑在提供者里。这个类承载判断的结果。

# 二、类的成员（字段、方法，各自做什么）

## （一）字段

- `allow`：判断结论。类型是`bool`。没有默认值。`True`表示允许。`False`表示拒绝。这是调用方最关心的字段。
- `reasons`：判断理由列表。类型是`list[AuthzReason]`，默认空列表。这里放结构化的理由。每条理由说明一部分原因。
- `policy_id`：做出判断的策略标识。类型是`str | None`，默认`None`。例如`"rbac:allow"`、`"rbac:deny"`、`"rbac:unrestricted"`。观察者用这个字段记录"哪条策略做了判断"。
- `metadata`：附加元数据字典。类型是`dict[str, Any]`，默认空字典。这里放提供者想附带的额外信息。

## （二）方法

这个类没有定义任何方法。

这个类是纯数据类。

# 三、它和谁协作

AuthzDecision是授权判断流程的"结论载体"。

协作关系如下。

`RbacAuthorizationProvider.authorize`构建AuthzDecision。允许时返回`allow=True`加`rbac:allow`策略标识。拒绝时返回`allow=False`加`rbac:deny`策略标识。无策略时返回`allow=True`加`rbac:unrestricted`策略标识。

`AuthorizationProvider`协议声明`authorize`和`aauthorize`返回这个类型。所有自定义提供者都要返回这个对象。

`GuardrailAuthorizationAdapter._to_guardrail`转换AuthzDecision。适配器把这个对象转成`GuardrailDecision`。转换保留`allow`、理由、策略标识、元数据。

`plugin_authz.py`里的`_validated_decision`校验这个对象。校验要求决策必须是`AuthzDecision`实例。校验还要求`allow`必须是真正的`bool`。字符串`"false"`是真值。字符串会被误读成允许。校验挡住这种错误。

`plugin_authz.py`里的`_deny_reason_code`读取这个对象。这个函数从拒绝决策里提取理由码。

组合关系上，AuthzDecision持有AuthzReason列表。

AuthzDecision自身只依赖AuthzReason。AuthzDecision是被消费的一方。

# 四、重要性评级（1-10分+理由）

评级：7分。

理由如下。

这个类是授权协议的核心输出结构。

没有AuthzDecision，提供者无法返回判断结果。

整个授权链路以这个对象为终点。

上游的`AuthzRequest`装问题。这个类装答案。

适配器、插件授权层、观察者都消费这个对象。

删掉它，授权协议就要重新设计。

依赖它的地方包括：RBAC提供者、自定义提供者、守卫适配器、插件授权层。

插件层还专门为它写了校验函数。校验挡住自定义提供者返回的错误类型。

评级不是满分，因为这个类是被动数据结构。这个类不执行任何逻辑。协议的核心是提供者协议。所以给7分。
