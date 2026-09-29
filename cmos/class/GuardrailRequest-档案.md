# GuardrailRequest-档案

## 一、这个类是干什么的

这个数据类是工具调用授权的请求对象。

这个类承载每次工具调用的完整上下文。

GuardrailMiddleware在每次工具调用前构造这个对象。

构造完成后，这个对象被交给GuardrailProvider评估。

提供者只看这个对象，不看真实的LangGraph请求对象。

这样做的目的是让提供者不依赖LangGraph类型。

这个类位于backend/packages/harness/deerflow/guardrails/provider.py。

## 二、类的成员（字段、方法，各自做什么）

这个类是纯数据类，没有方法。

字段分三组。

### 1、工具调用信息

- tool_name是工具名字。
- tool_input是工具参数字典。
- tool_call_id是工具调用标识。

### 2、运行上下文信息

- agent_id是代理身份。
- thread_id是会话标识。
- run_id是运行标识。
- is_subagent标记是否子代理调用。
- timestamp是调用时间。

### 3、用户身份信息

- user_id是用户标识。
- user_role是用户角色。
- oauth_provider是OAuth提供方。
- oauth_id是OAuth标识。
- channel_user_id是渠道用户标识。
- is_internal标记是否内部调用者。
- authz_attributes是归一化后的授权属性。

后三个字段带默认值。

带默认值的目的明确。

旧提供者可以不读这些新字段。

新字段不破坏旧提供者。

## 三、它和谁协作

- GuardrailMiddleware负责构造这个对象。Middleware从LangGraph的ToolCallRequest和运行时上下文提取字段。
- GuardrailProvider消费这个对象。提供者根据这些字段做决定。
- normalize_authz_attributes负责把运行时的授权属性归一化后填入authz_attributes字段。

## 四、重要性评级

评级是7分。

理由如下。

这个类是门禁请求的唯一载体。

提供者能看到的上下文完全由它决定。

字段缺失或缺失含义错误会导致授权决定错误。

但它只是被动数据容器。

没有行为逻辑。

扣掉3分。
