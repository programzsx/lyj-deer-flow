# deerflow.authz.adapter-档案

## 一、这个模块是干什么的

这个文件是授权提供者的护栏适配器。

它把AuthorizationProvider包装成GuardrailProvider的样子。

这让现有的GuardrailMiddleware能在工具调用时执行授权决策。

不需要新建中间件类。这是RFC第6.1节的设计。

适配器做三件事。

第一件是把GuardrailRequest的字段映射成AuthzRequest的字段。

第二件是调用授权提供者。

第三件是把AuthzDecision转回GuardrailDecision。

## 二、模块里的主要成员

### 1、GuardrailAuthorizationAdapter类

这个类实现GuardrailProvider协议的样子。name是authorization。

#### （1）初始化

保存提供者、默认角色、资源类型、动作、基础设施工具名。

resource_type和action默认是tool和call。这对工具执行路径是正确的。适配器复用到工具路径之外时可以注入不同的组合。

infrastructure_tool_names是基础设施工具名集合。这些工具由已经授权的能力集创建。它们可以不用第二次提供者判决就执行。调用方必须从当前构建的具体延迟装配派生名字。不能从静态配置派生。

#### （2）_infrastructure_decision

这个函数放行由已过滤能力集创建的框架工具。

工具名不在基础设施名单里时返回None。

在名单里时返回allow为True的决策。policy_id是authz:infrastructure。

#### （3）_to_authz映射

这个函数把护栏请求映射成授权请求。

Principal构建委托给build_principal_from_context。第一层工具装配和第二层适配器共享一个身份构建器。default_role和attributes语义一致。

上下文里的字段有thread_id、run_id、tool_call_id、tool_input、is_subagent、agent_id、timestamp。

#### （4）_to_guardrail转换

这个函数把授权决策转成护栏决策。

allow和policy_id直接传。reasons逐个转成GuardrailReason。

#### （5）evaluate和aevaluate

这是同步和异步的两个评估方法。

先检查基础设施工具。命中就直接放行。

然后委托provider的authorize或aauthorize。

提供者的异常刻意允许传播。适配器被GuardrailMiddleware消费。中间件的wrap_tool_call已经基于fail_closed参数应用fail-closed语义。fail_closed由AuthorizationConfig支持。在这里捕捉异常会重复那个逻辑。还会让两层之间的行为分叉。

## 三、它和谁协作

它依赖authz.principal里的build_principal_from_context。

它依赖authz.provider里的AuthorizationProvider和AuthzRequest。

它依赖guardrails.provider里的GuardrailDecision和GuardrailRequest。

它被guardrails的中间件消费。中间件在工具调用时调用它。

它是第一层和第二层之间的桥。

## 四、重要性评级

评级是7分。

理由是这个文件是两层执行设计的关键连接件。

没有它，授权决策需要新的中间件类。两层会各自实现评估逻辑。

异常传播的决策让fail-closed语义留在中间件一层。不会分叉。

基础设施工具的放行是延迟工具装配的必要条件。

不评更高分是因为它只是适配层。决策逻辑在provider和rbac里。
