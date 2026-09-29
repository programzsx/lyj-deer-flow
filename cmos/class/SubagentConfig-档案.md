# SubagentConfig档案

源码位置：backend/packages/harness/deerflow/subagents/config.py

## 一、这个类是干什么的

SubagentConfig是一个子Agent的配置。

SubagentConfig定义一个子Agent是什么、能干什么。

具体有这些。子Agent叫什么名字。什么时候委派给它。系统提示是什么。能用哪些工具。能用哪些技能。用哪个模型。最多多少轮。超时多久。

SubagentConfig是一个dataclass。SubagentConfig不是frozen的。

## 二、类的成员

（一）字段

- name：子Agent的唯一标识。
- description：什么时候委派给这个子Agent。
- system_prompt：引导子Agent行为的系统提示。默认None。
- tools：允许的工具名列表。None表示继承所有工具。
- disallowed_tools：拒绝的工具名列表。默认拒绝task。子Agent不能再委派。
- skills：可发现可激活的技能名列表。None表示所有启用的技能都可用。空列表表示这个子Agent禁用技能。
- model：模型。inherit表示用父Agent的模型。默认inherit。
- max_turns：最大Agent轮次。一轮是一次模型调用加它跑的工具。默认50。内置Agent用自己的值。general-purpose是150。bash是60。
- timeout_seconds：裸的执行时间上限。默认900。内置Agent的实际上限是全局subagents.timeout_seconds。默认1800秒。
- prompt_overlay：围绕完整系统消息的运维指令。

## 三、它和谁协作

（一）产生者

内置Agent定义产生SubagentConfig。config.yaml的custom_agents产生SubagentConfig。管理员管理的定义也产生。

（二）消费者

SubagentExecutor用SubagentConfig。executor从config读名字、系统提示、工具过滤、模型、轮次上限。

（三）模型解析

resolve_subagent_model_name函数用config解析实际模型名。inherit时用父模型。父模型也没有时用配置的第一个模型。

## 四、重要性评级

评级：6分。

理由：SubagentConfig是子Agent的声明载体。每个子Agent是什么都由它定义。工具过滤、模型选择、轮次上限都在这里声明。它是数据模型，不承载执行逻辑。给6分。
