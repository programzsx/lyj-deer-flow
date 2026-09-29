# GuardrailAuthorizationAdapter-档案

# 一、这个类是干什么的

GuardrailAuthorizationAdapter定义在`backend/packages/harness/deerflow/authz/adapter.py`。

这个类是适配器。适配器把`AuthorizationProvider`包装成`GuardrailProvider`。

模块docstring说明了这个类的用途。

现有的`GuardrailMiddleware`会执行守卫判断。这个适配器让`GuardrailMiddleware`在工具调用时执行授权提供者的决策。

这样做不需要新的中间件类。设计文档是RFC第6.1节。

这个类的工作方式。

适配器把`GuardrailRequest`的字段映射到`AuthzRequest`的字段。

适配器调用授权提供者。

适配器把`AuthzDecision`转回`GuardrailDecision`。

Principal的构建委托给`build_principal_from_context`函数。

委托是为了让第一层（工具组装）和第二层（这个适配器）共享同一个身份构建器。两层有相同的`default_role`和`attributes`语义。

这个类在什么场景被使用。

授权开启的部署里，工具执行的每次调用都会经过这个适配器。适配器把授权决策接入guardrails链路。

# 二、类的成员（字段、方法，各自做什么）

## （一）构造参数和内部状态

构造参数如下。

- `provider`：要委托判断的授权提供者。类型是`AuthorizationProvider`。这是必填参数。
- `default_role`：运行上下文里`user_role`缺失或为空时使用的角色。类型是`str`，默认`"user"`。必须由Phase 1B接线从`AuthorizationConfig.default_role`传入。
- `resource_type`：所有`AuthzRequest`的资源类型。类型是`str`，默认`"tool"`。
- `action`：所有`AuthzRequest`的动作。类型是`str`，默认`"call"`。默认值对工具执行路径是正确的。适配器在工具路径之外复用时可以注入别的资源/动作组合。
- `infrastructure_tool_names`：基础设施工具名集合。类型是字符串集合。这些工具来自已授权的能力集。这些工具可以不经第二次提供者判断就执行。调用方必须从当前构建的具体延迟装配推导这些名字。调用方不能从静态配置推导。

内部状态就是上述参数保存后的`_provider`、`_default_role`、`_resource_type`、`_action`、`_infrastructure_tool_names`。

类属性`name`的值是`"authorization"`。

## （二）方法

- `_infrastructure_decision(request) -> GuardrailDecision | None`：判断请求的工具是不是基础设施工具。工具在集合里就返回允许决策，理由码是`authz.infrastructure_tool`。不在就返回`None`。返回`None`表示继续走正常授权流程。
- `_to_authz(gr: GuardrailRequest) -> AuthzRequest`：把守卫请求映射成授权请求。先调用`build_principal_from_context`构建操作者。传入用户ID、角色、OAuth信息、渠道ID、内部标记、授权属性。再构造`AuthzRequest`。资源类型和动作用构造时注入的默认值。目标用`gr.tool_name`。上下文放`thread_id`、`run_id`、`tool_call_id`、`tool_input`、`is_subagent`、`agent_id`、`timestamp`。
- `_to_guardrail(d: AuthzDecision) -> GuardrailDecision`：静态方法。把授权决策转成守卫决策。保留`allow`、理由列表、策略标识、元数据。理由逐条转换成`GuardrailReason`。
- `evaluate(request) -> GuardrailDecision`：同步评估。先查基础设施工具捷径。然后委托`provider.authorize`。最后转换结果。提供者异常会向上传播。传播是刻意的。消费方`GuardrailMiddleware`已有fail-closed语义。fail-closed由`AuthorizationConfig.fail_closed`决定。在适配器里捕获异常会重复这套逻辑。重复有行为分歧的风险。
- `aevaluate(request)`：异步评估。先查基础设施工具捷径。然后委托`provider.aauthorize`。最后转换结果。异常传播理由同上。

# 三、它和谁协作

这个类是授权层和guardrails层之间的桥。

上游关系如下。

适配器持有`AuthorizationProvider`实例。这个实例通常是`RbacAuthorizationProvider`。

适配器调用`build_principal_from_context`构建Principal。这个函数在`deerflow/authz/principal.py`里。

适配器使用`AuthzRequest`、`AuthzDecision`。这两个类在`deerflow/authz/provider.py`里。

适配器使用`GuardrailDecision`、`GuardrailReason`、`GuardrailRequest`。这三个类在`deerflow/guardrails/provider.py`里。

消费关系如下。

`GuardrailMiddleware`消费这个适配器。适配器的`evaluate`/`aevaluate`满足`GuardrailProvider`协议。中间件在`wrap_tool_call`/`awrap_tool_call`里调用适配器。

接线方从`AuthorizationConfig`取出提供者和`default_role`。接线方构造适配器。适配器作为守卫提供者装进中间件。

设计上，这个类没有基类。这个类通过`name`、`evaluate`、`aevaluate`满足守卫协议。

# 四、重要性评级（1-10分+理由）

评级：8分。

理由如下。

这个类是授权体系第二层（运行时执行判断）的实现载体。

没有这个适配器，授权提供者的决策无法接入工具执行链路。

没有这个适配器，就要写一个新的中间件类。新中间件会重复guardrails的逻辑。

设计文档刻意选择适配器方案。适配器方案复用现有中间件。复用避免了两套fail-closed逻辑。

第一层过滤挡住静态能力。第二层靠这个适配器捕捉动态资源和参数级限制。

删掉它，运行时授权完全失效。

依赖它的地方包括：guardrails中间件、授权接线、Principal构建器调用链。

这个类也是身份一致性设计的落点。两层共享同一个身份构建器靠它。

评级不是满分，因为它是桥梁结构。判断本身在提供者里。但桥梁是第二层存在的必要条件。所以给8分。
