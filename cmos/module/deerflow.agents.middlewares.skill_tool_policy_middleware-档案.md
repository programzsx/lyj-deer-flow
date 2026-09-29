# deerflow.agents.middlewares.skill_tool_policy_middleware档案

源码路径是backend/packages/harness/deerflow/agents/middlewares/skill_tool_policy_middleware.py。

## 一、这个中间件是干什么的

这个中间件负责把技能的allowed-tools策略应用到智能体工具集上。

技能可以声明自己的allowed-tools。

allowed-tools声明这个技能激活时智能体只能用哪些工具。

这个中间件只在技能真正"激活"时才应用这个策略。

仅仅启用一个技能只让技能可被发现。

启用不等于激活。

技能在两种情况下变成策略活跃。

第一种是用户在本轮运行里用斜杠命令激活了技能。

第二种是模型把技能加载进了skill_context。

斜杠激活的权威性更高。

斜杠激活之后的整轮运行里，被动读第二个技能不能扩大斜杠技能的权限范围。

这个中间件在模型调用前过滤工具schema。

这个中间件在工具执行前拦截未授权的调用。

这个中间件还过滤tool_search的发现结果。

这样被策略移除的工具不会被tool_search绕过。

## 二、模块里的主要成员

### 1、SkillToolPolicyMiddleware类

这个类继承AgentMiddleware。

构造函数接收四个参数。

available_skills是自定义智能体的技能白名单。

app_config是应用配置。

user_id是用户标识。

slash_source_owner_token是斜杠技能来源的持有者令牌。

持有者令牌必须是非空字符串，否则构造报错。

构造时还生成一个随机的决策持有者令牌。

这个令牌用于防止伪造的决策数据。

### 2、三个策略来源

策略来源有三种。

_POLICY_SOURCE_PASSIVE表示被动状态，没有任何活跃技能。

_POLICY_SOURCE_SLASH表示斜杠激活。

_POLICY_SOURCE_SKILL_CONTEXT表示技能被加载进skill_context。

策略签名是来源加路径元组的组合。

### 3、_active_policy

这个方法解析当前的活跃策略。

这个方法先从运行时上下文读斜杠技能来源路径。

读的时候用持有者令牌认证。

斜杠路径存在就返回slash来源和该路径。

斜杠路径不存在就继续。

这个方法再从state里读skill_context条目。

条目的path字段收集成路径元组。

路径元组非空就返回skill_context来源。

都没有就返回passive来源。

state形状异常会记录警告并按空处理。

这一步防止异常形状让中间件崩溃。

### 4、_active_skills_for_paths

这个方法把路径解析成真正的技能对象。

这个方法先加载全部技能。

加载失败时返回策略失败信号。

策略失败信号让调用方只保留框架安全工具。

这是fail-closed设计。

这个方法构建路径到技能的注册表。

然后逐条校验每个活跃路径。

路径必须能解析到技能。

技能必须是启用状态。

技能必须在智能体白名单之内。

重复的技能名会被去重。

一条路径都授权不了就fail-closed。

### 5、_allowed_names_for_paths

这个方法计算允许的工具名集合。

策略失败就返回ALWAYS_AVAILABLE_BUILTIN_TOOL_NAMES。

这是框架安全工具集合。

技能没有声明allowed-tools就返回None。

None表示不限制。

声明了就取声明集合加上框架安全工具集合。

### 6、决策的存取

_store_policy_decision把策略决策存进运行时上下文。

决策包含version、owner_token、source、active_paths、allowed_names。

_SKILL_TOOL_POLICY_DECISION_CONTEXT_KEY是决策的上下文键。

决策的owner_token是授权敏感的。

这个键由runtime的secret_context管理。

_read_policy_decision读回决策并做完整校验。

version必须匹配。

owner_token必须匹配本实例的令牌。

source必须匹配当前策略来源。

active_paths必须和当前路径完全一致。

allowed_names必须是字符串列表。

任何一项不匹配就按"决策缺失"处理。

决策缺失就回退到实时解析。

这套校验防止伪造的、外来的、过期的决策。

### 7、_filter_model_request

这个方法过滤模型请求里的工具schema。

allowed为None就不动请求。

否则只保留名字在allowed集合里的工具。

refresh_decision为true时会重新计算决策并存入上下文。

### 8、wrap_model_call和awrap_model_call

wrap_model_call先解析活跃策略。

然后过滤请求并刷新决策。

异步版本在没有活跃路径时直接放行。

有活跃路径时用asyncio.to_thread跑同步过滤。

这一步避免阻塞事件循环。

### 9、wrap_tool_call和awrap_tool_call

这两个钩子在工具执行前拦截。

没有活跃路径就直接放行。

有活跃路径就先解析allowed集合。

被拦截的调用返回错误ToolMessage。

错误消息是"Error: Tool 'x' is not allowed by the active skill policy."。

没被拦截的调用执行后还要过_filter_tool_search_result。

### 10、_filter_tool_search_result

这个方法过滤tool_search的输出。

只处理名字是tool_search的调用。

allowed为None就不动结果。

结果必须是Command且带合法的promoted和messages。

形状不对就返回策略错误ToolMessage。

promoted里的名字只保留allowed集合内的。

messages里的schema JSON会被解析并过滤。

schema名不在允许集合里的会被移除。

JSON解析失败就返回策略错误。

过滤后schema为空时内容变成"No tools found matching the active skill policy."。

这个设计保证tool_search不会泄露被策略移除工具的完整schema。

## 三、它和谁协作

在中间件链里这个中间件的位置是固定的。

这个中间件必须紧跟在SkillActivationMiddleware之后。

这个中间件必须紧跟在DurableContextMiddleware之前。

装配测试和编译图测试固定了这个顺序。

上游是SkillActivationMiddleware。

SkillActivationMiddleware通过runtime的secret_context发布斜杠激活来源。

发布路径用令牌认证。

令牌只在装配好的中间件链内共享。

下游是DurableContextMiddleware。

这个中间件依赖deerflow.skills.storage加载技能。

依赖deerflow.skills.tool_policy计算allowed-tools。

依赖deerflow.runtime.secret_context读取斜杠来源和决策键。

lead_agent的build_middlewares负责装配这个中间件。

tool_search工具和这个中间件协作。

被限制的策略下tool_search仍是发现工具。

但被策略移除的业务工具的schema不能通过tool_search存活。

## 重要性评级

评级是7分。

理由如下。

技能的allowed-tools是技能系统的安全特性。

没有这个中间件，技能声明的工具限制形同虚设。

这个中间件覆盖了schema过滤、执行拦截、发现结果过滤三个面。

决策校验考虑了伪造、外来、过期、不匹配四种攻击面。

fail-closed设计保证了授权失败时不放权。

所以评级是7分。

不评8分以上的原因有两个。

第一，代码自己声明这是best-effort行为约束而不是硬安全边界。

bash cat这样的旁路加载不会被捕获。

第二，这个中间件只在斜杠或skill_context激活时起作用。

普通运行没有活跃技能时这个中间件是透明的。
