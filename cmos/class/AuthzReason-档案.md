# AuthzReason-档案

# 一、这个类是干什么的

AuthzReason定义在`backend/packages/harness/deerflow/authz/provider.py`。

这个类表示"一条结构化的判断理由"。

授权系统要给出allow或deny的结论。

系统还要说明"为什么"。

AuthzReason就是那个"为什么"。

模块docstring说明这个类承载一条结构化的allow/deny理由。

一个判断可以带多条理由。

理由放在`AuthzDecision`的`reasons`列表里。

这个类很小。这个类只有两个字段。

但是这个类有实际作用。

观察者和日志系统读这些理由码。观察者用理由码记录"哪条策略做了判断"。

排查授权问题时，理由码是关键线索。

例如`authz.no_policy`说明没有配置策略。

例如`authz.denied`说明角色被明确拒绝。

# 二、类的成员（字段、方法，各自做什么）

## （一）字段

- `code`：机器可读的理由码。类型是`str`。没有默认值。例如`"authz.allowed"`、`"authz.denied"`、`"authz.no_policy"`。程序读这个码做逻辑处理。
- `message`：人类可读的说明。类型是`str`，默认空字符串。例如"role 'user' is denied 'update_agent' on resource 'tools'"。人看这个字段理解原因。

## （二）方法

这个类没有定义任何方法。

这个类是纯数据类。

# 三、它和谁协作

AuthzReason是判断结果的一部分。

协作关系如下。

`RbacAuthorizationProvider`在构建`AuthzDecision`时创建AuthzReason。允许时创建`authz.allowed`理由。拒绝时创建`authz.denied`理由加具体说明。无策略时创建`authz.no_policy`理由。

`AuthzDecision`的`reasons`字段是`list[AuthzReason]`。理由列表挂在判断结果上。

`GuardrailAuthorizationAdapter`把AuthzReason转换成`GuardrailReason`。转换发生在适配器把授权判断转回守卫判断的时候。转换保留`code`和`message`。

`plugin_authz.py`里的`_deny_reason_code`函数读取AuthzReason。这个函数从拒绝理由里提取第一个有效的理由码。这个函数容忍坏的理由列表。理由列表读不出来时，这个函数退回`authz.denied`。

组合关系上，AuthzReason被AuthzDecision持有。

AuthzReason自身不依赖其他类。

# 四、重要性评级（1-10分+理由）

评级：6分。

理由如下。

这个类是授权判断的可解释性载体。

授权系统不能只说"不行"。

系统要能说明"为什么不行"。

AuthzReason承担这个说明职责。

没有它，排查授权问题只能靠猜。

没有它，观察者无法记录策略决策。

删掉它，`AuthzDecision`的结构就要改，适配器转换逻辑也要改。

但是这个类本身很简单。这个类只有两个字段。这个类没有任何行为。

这个类的价值来自被使用的场景。使用场景重要，但类本身极轻。

所以给6分。
