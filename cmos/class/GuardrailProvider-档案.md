# GuardrailProvider-档案

## 一、这个类是干什么的

这个类定义了工具调用前的授权契约。

这个类是一个Protocol协议类。

这个类不提供任何实现。

这个类只规定了一件事。

任何想给工具调用做门禁的提供者，都要能回答同一个问题。

这个问题是"这次工具调用允许执行吗"。

DeerFlow在工具真正执行之前，会把调用的信息交给一个GuardrailProvider。

这个提供者返回一个allow或deny的决定。

这个机制类似OAP标准的Decision对象。

这个类位于backend/packages/harness/deerflow/guardrails/provider.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、GuardrailRequest数据类

这个数据类是传递给提供者的上下文。

这个数据类的字段如下。

- tool_name是工具名字符串。
- tool_input是工具的参数字典。
- agent_id是可选的代理身份，由GuardrailMiddleware填入passport。
- thread_id是可选的会话标识。
- is_subagent标记这次调用是否来自子代理。
- timestamp是调用时间戳字符串。
- user_id是用户标识。
- user_role是用户角色。
- oauth_provider和oauth_id是OAuth身份信息。
- run_id是运行标识。
- tool_call_id是工具调用标识。
- channel_user_id是渠道用户标识。
- is_internal标记调用者是否内部身份。
- authz_attributes是授权属性字典。

后三个字段由GuardrailMiddleware从运行时上下文填充。

这三个字段带默认值。

带默认值的目的是向后兼容。

不读这些字段的旧提供者不会被破坏。

### 2、GuardrailReason数据类

这个数据类是决定理由的结构化对象。

- code字段是机器可读的原因代码，例如"oap.tool_not_allowed"。
- message字段是人类可读的说明文字。

这个结构和OAP的reason对象对齐。

### 3、GuardrailDecision数据类

这个数据类是提供者的最终裁决。

- allow字段是布尔值，表示允许还是拒绝。
- reasons字段是GuardrailReason的列表。
- policy_id字段是可选的策略标识。
- metadata字段是附加元数据字典。

### 4、GuardrailProvider协议本身

- name字段是提供者名字。
- evaluate(request)方法是同步评估方法，返回GuardrailDecision。
- aevaluate(request)方法是异步评估方法，返回GuardrailDecision。

这个类用@runtime_checkable装饰。

这个类不需要基类。

任何实现了这两个方法的类都符合契约。

提供者通过类路径字符串加载。

加载机制是resolve_variable()。

这和models、tools、sandbox用的加载机制相同。

## 三、它和谁协作

- GuardrailMiddleware消费这个协议。Middleware在每次工具调用前构造GuardrailRequest并调用evaluate或aevaluate。
- AllowlistProvider是内置实现，在guardrails/builtin.py。
- TypeSafeGuardrailProvider是另一个实现，在guardrails/typesafe.py。
- 配置层的GuardrailsConfig负责选择用哪个提供者。

## 四、重要性评级

评级是9分。

理由如下。

这个类是工具授权门禁的根基契约。

所有门禁行为都建立在这三个数据类和一个协议上。

没有这个契约，工具调用就没有统一的拦截点。

它直接影响系统安全边界。

它本身没有逻辑，扣掉1分。

扣分原因是它只是声明。
